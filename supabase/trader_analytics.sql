-- Trader Analytics schema.
-- This version intentionally supports a no-login dashboard by allowing anon/authenticated SELECT + INSERT.
-- Before storing sensitive trading data on a public site, add Supabase Auth and owner-based RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 20),
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(20,8) not null check (entry_price >= 0),
  exit_price numeric(20,8) not null check (exit_price >= 0),
  net_pnl numeric(20,2) not null,
  strategy_tag text not null check (strategy_tag in ('Breakout', 'Reversal', 'Trend Following')),
  risk_reward numeric(10,4) check (risk_reward is null or risk_reward >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.trade_leaks (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  leak_tag text not null check (leak_tag in ('FOMO', 'Chasing', 'Stopped out early', 'Revenge trade')),
  loss_amount numeric(20,2) not null default 0 check (loss_amount >= 0),
  created_at timestamptz not null default now(),
  unique (trade_id, leak_tag)
);

create index if not exists trades_strategy_tag_idx on public.trades(strategy_tag);
create index if not exists trades_created_at_idx on public.trades(created_at desc);
create index if not exists trade_leaks_leak_tag_idx on public.trade_leaks(leak_tag);
create index if not exists trade_leaks_trade_id_idx on public.trade_leaks(trade_id);

alter table public.trades enable row level security;
alter table public.trade_leaks enable row level security;

grant select, insert on public.trades to anon, authenticated;
grant select, insert on public.trade_leaks to anon, authenticated;
revoke update, delete on public.trades from anon, authenticated;
revoke update, delete on public.trade_leaks from anon, authenticated;

drop policy if exists "Trader Analytics read trades" on public.trades;
create policy "Trader Analytics read trades"
on public.trades for select
to anon, authenticated
using (true);

drop policy if exists "Trader Analytics insert trades" on public.trades;
create policy "Trader Analytics insert trades"
on public.trades for insert
to anon, authenticated
with check (true);

drop policy if exists "Trader Analytics read leaks" on public.trade_leaks;
create policy "Trader Analytics read leaks"
on public.trade_leaks for select
to anon, authenticated
using (true);

drop policy if exists "Trader Analytics insert leaks" on public.trade_leaks;
create policy "Trader Analytics insert leaks"
on public.trade_leaks for insert
to anon, authenticated
with check (true);
