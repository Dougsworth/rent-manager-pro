-- AI Chat usage tracking (rate-limiting Gemini calls)
create table if not exists public.ai_chat_usage (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references auth.users(id) on delete cascade not null,
  usage_date date not null default current_date,
  request_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (landlord_id, usage_date)
);

-- RLS
alter table public.ai_chat_usage enable row level security;

-- Landlords can read their own usage
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_chat_usage'
      and policyname = 'Landlords can view own AI usage'
  ) then
    create policy "Landlords can view own AI usage"
      on public.ai_chat_usage for select
      using (auth.uid() = landlord_id);
  end if;
end $$;

-- Edge function uses service role for inserts/updates, so no INSERT/UPDATE policy needed for users
