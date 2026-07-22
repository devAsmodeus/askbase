-- Plan limits: single source of truth for enforcement
create or replace function public.plan_limits(p_plan text)
returns jsonb language sql immutable as $$
  select case p_plan
    when 'pro' then '{"max_bots":5,"max_docs_per_bot":50,"max_doc_bytes":10485760,"max_messages_per_month":2000,"can_remove_branding":true}'::jsonb
    when 'business' then '{"max_bots":20,"max_docs_per_bot":500,"max_doc_bytes":26214400,"max_messages_per_month":10000,"can_remove_branding":true}'::jsonb
    else '{"max_bots":1,"max_docs_per_bot":5,"max_doc_bytes":2097152,"max_messages_per_month":100,"can_remove_branding":false}'::jsonb
  end
$$;

-- Public bot info for the embeddable widget (keyed by public_id)
create or replace function public.widget_get_bot(p_public_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
    'name', b.name,
    'welcome_message', b.welcome_message,
    'accent_color', b.accent_color,
    'allowed_domains', b.allowed_domains,
    'show_branding', not coalesce((public.plan_limits(p.plan)->>'can_remove_branding')::boolean, false)
  ) into v
  from public.bots b join public.profiles p on p.id = b.owner_id
  where b.public_id = p_public_id;
  return v; -- null when bot not found
end $$;

-- Vector similarity search over a bot's chunks (public: keyed by public_id)
create or replace function public.match_chunks(p_public_id text, p_query vector(384), p_count int default 6)
returns table (content text, document_name text, similarity float)
language plpgsql security definer set search_path = public as $$
declare
  v_bot uuid;
begin
  select id into v_bot from public.bots where public_id = p_public_id;
  if v_bot is null then return; end if;
  return query
    select c.content, d.name, 1 - (c.embedding <=> p_query) as similarity
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.bot_id = v_bot and c.embedding is not null
    order by c.embedding <=> p_query
    limit least(p_count, 20);
end $$;

-- Consume one widget message against the owner's monthly quota
create or replace function public.consume_widget_message(p_public_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_plan text; v_limit int; v_used int; v_period text;
begin
  select b.owner_id, p.plan into v_owner, v_plan
  from public.bots b join public.profiles p on p.id = b.owner_id
  where b.public_id = p_public_id;
  if v_owner is null then
    return jsonb_build_object('allowed', false, 'reason', 'bot_not_found');
  end if;
  v_limit := (public.plan_limits(v_plan)->>'max_messages_per_month')::int;
  v_period := to_char(now(), 'YYYY-MM');
  insert into public.usage_counters (owner_id, period, messages)
    values (v_owner, v_period, 0)
    on conflict (owner_id, period) do nothing;
  select messages into v_used from public.usage_counters
    where owner_id = v_owner and period = v_period for update;
  if v_used >= v_limit then
    return jsonb_build_object('allowed', false, 'reason', 'quota_exceeded', 'used', v_used, 'limit', v_limit);
  end if;
  update public.usage_counters set messages = messages + 1
    where owner_id = v_owner and period = v_period;
  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', v_limit);
end $$;

-- Widget conversation logging
create or replace function public.widget_start_conversation(p_public_id text, p_visitor_id text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_bot uuid; v_id uuid;
begin
  select id into v_bot from public.bots where public_id = p_public_id;
  if v_bot is null then return null; end if;
  insert into public.conversations (bot_id, source, visitor_id)
    values (v_bot, 'widget', p_visitor_id) returning id into v_id;
  return v_id;
end $$;

create or replace function public.widget_log_message(
  p_public_id text, p_conversation uuid, p_role text, p_content text, p_sources jsonb default '[]'
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.conversations c join public.bots b on b.id = c.bot_id
    where c.id = p_conversation and b.public_id = p_public_id and c.source = 'widget'
  ) then
    return;
  end if;
  insert into public.messages (conversation_id, role, content, sources)
    values (p_conversation, p_role, p_content, coalesce(p_sources, '[]'::jsonb));
end $$;

-- keep bots.updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger bots_touch before update on public.bots
  for each row execute function public.touch_updated_at();
