-- Hard enforcement of plan limits at the DB level (UI checks are advisory)
create or replace function public.enforce_bot_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan text; v_limit int; v_count int;
begin
  select plan into v_plan from public.profiles where id = new.owner_id;
  v_limit := (public.plan_limits(coalesce(v_plan, 'free'))->>'max_bots')::int;
  select count(*) into v_count from public.bots where owner_id = new.owner_id;
  if v_count >= v_limit then
    raise exception 'plan_limit: your plan allows % bot(s). Upgrade to create more.', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger bots_enforce_limit before insert on public.bots
  for each row execute function public.enforce_bot_limit();

create or replace function public.enforce_document_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan text; v_limit int; v_bytes bigint; v_count int;
begin
  select p.plan into v_plan from public.profiles p where p.id = new.owner_id;
  v_limit := (public.plan_limits(coalesce(v_plan, 'free'))->>'max_docs_per_bot')::int;
  v_bytes := (public.plan_limits(coalesce(v_plan, 'free'))->>'max_doc_bytes')::bigint;
  select count(*) into v_count from public.documents where bot_id = new.bot_id;
  if v_count >= v_limit then
    raise exception 'plan_limit: your plan allows % documents per bot. Upgrade to add more.', v_limit
      using errcode = 'P0001';
  end if;
  if new.size_bytes > v_bytes then
    raise exception 'plan_limit: document exceeds your plan size limit.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger documents_enforce_limit before insert on public.documents
  for each row execute function public.enforce_document_limit();
