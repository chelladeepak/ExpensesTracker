-- Supabase schema for the salary/income/expense tracker app.
-- Run this in the Supabase SQL editor for the project used by VITE_SUPABASE_URL.

create extension if not exists pgcrypto;

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.app_state is 'Stores the full tracker app snapshot used by the React client.';
comment on column public.app_state.id is 'App-level unique key. Current app uses salary-tracker-one-year.';
comment on column public.app_state.payload is 'Full JSON snapshot containing companyName, persons, entries, expenses, and incomes.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on public.app_state;

create trigger app_state_set_updated_at
before update on public.app_state
for each row
execute function public.set_updated_at();

alter table public.app_state enable row level security;

drop policy if exists "Allow anon/auth read app_state" on public.app_state;
create policy "Allow anon/auth read app_state"
on public.app_state
for select
to anon, authenticated
using (id = 'salary-tracker-one-year');

drop policy if exists "Allow anon/auth insert app_state" on public.app_state;
create policy "Allow anon/auth insert app_state"
on public.app_state
for insert
to anon, authenticated
with check (id = 'salary-tracker-one-year');

drop policy if exists "Allow anon/auth update app_state" on public.app_state;
create policy "Allow anon/auth update app_state"
on public.app_state
for update
to anon, authenticated
using (id = 'salary-tracker-one-year')
with check (id = 'salary-tracker-one-year');

insert into public.app_state (id, payload)
values (
  'salary-tracker-one-year',
  jsonb_build_object(
    'companyName', 'MANDUVA KITCHEN LLP',
    'persons', '[]'::jsonb,
    'entries', '[]'::jsonb,
    'expenses', '[]'::jsonb,
    'incomes', '[]'::jsonb
  )
)
on conflict (id) do nothing;