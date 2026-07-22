create extension if not exists vector;
create extension if not exists pgcrypto;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free','pro','business')),
  plan_started_at timestamptz,
  billing_period_ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ bots ============
create table public.bots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  public_id text not null unique default encode(gen_random_bytes(8), 'hex'),
  name text not null,
  description text not null default '',
  system_prompt text not null default '',
  welcome_message text not null default 'Hi! I''m here to help. Ask me anything about our docs.',
  accent_color text not null default '#6366F1',
  allowed_domains text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bots enable row level security;
create policy "bots_all_own" on public.bots for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index bots_owner_idx on public.bots(owner_id);

-- ============ documents ============
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  source_type text not null default 'file' check (source_type in ('file','text')),
  size_bytes bigint not null default 0,
  status text not null default 'processing' check (status in ('processing','ready','error')),
  error text,
  chunk_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "documents_all_own" on public.documents for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index documents_bot_idx on public.documents(bot_id);

-- ============ chunks ============
create table public.chunks (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  idx int not null default 0,
  content text not null,
  embedding vector(384)
);
alter table public.chunks enable row level security;
create policy "chunks_all_own" on public.chunks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index chunks_bot_idx on public.chunks(bot_id);
create index chunks_embedding_idx on public.chunks using hnsw (embedding vector_cosine_ops);

-- ============ conversations & messages ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  source text not null default 'playground' check (source in ('playground','widget')),
  visitor_id text,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "conversations_select_bot_owner" on public.conversations for select
  using (exists (select 1 from public.bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "conversations_insert_bot_owner" on public.conversations for insert
  with check (exists (select 1 from public.bots b where b.id = bot_id and b.owner_id = auth.uid()));
create index conversations_bot_idx on public.conversations(bot_id);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "messages_select_bot_owner" on public.messages for select
  using (exists (
    select 1 from public.conversations c join public.bots b on b.id = c.bot_id
    where c.id = conversation_id and b.owner_id = auth.uid()));
create policy "messages_insert_bot_owner" on public.messages for insert
  with check (exists (
    select 1 from public.conversations c join public.bots b on b.id = c.bot_id
    where c.id = conversation_id and b.owner_id = auth.uid()));
create index messages_conversation_idx on public.messages(conversation_id);

-- ============ usage & billing ============
create table public.usage_counters (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  period text not null, -- 'YYYY-MM'
  messages int not null default 0,
  primary key (owner_id, period)
);
alter table public.usage_counters enable row level security;
create policy "usage_select_own" on public.usage_counters for select using (auth.uid() = owner_id);

create table public.billing_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('upgrade','downgrade','payment','cancel')),
  plan text not null,
  amount_cents int not null default 0,
  card_last4 text,
  created_at timestamptz not null default now()
);
alter table public.billing_events enable row level security;
create policy "billing_select_own" on public.billing_events for select using (auth.uid() = owner_id);
create policy "billing_insert_own" on public.billing_events for insert with check (auth.uid() = owner_id);
