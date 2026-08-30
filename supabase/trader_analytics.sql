-- Trader Analytics schema.
-- This version intentionally supports a no-login dashboard by allowing anon/authenticated SELECT + INSERT.
-- Before storing sensitive trading data on a public site, add Supabase Auth and owner-based RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 20),
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(20,8) not null check (entry_price > 0),
  exit_price numeric(20,8) not null check (exit_price > 0),
  net_pnl numeric(20,2) not null,
  strategy_tag text not null check (strategy_tag in ('Breakout', 'Reversal', 'Trend Following')),
  risk_reward numeric(10,4) check (risk_reward is null or risk_reward > 0),
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

-- Keep validation aligned when this script is re-run against an older Trader Analytics schema.
alter table public.trades drop constraint if exists trades_entry_price_check;
alter table public.trades add constraint trades_entry_price_check check (entry_price > 0);
alter table public.trades drop constraint if exists trades_exit_price_check;
alter table public.trades add constraint trades_exit_price_check check (exit_price > 0);
alter table public.trades drop constraint if exists trades_risk_reward_check;
alter table public.trades add constraint trades_risk_reward_check check (risk_reward is null or risk_reward > 0);

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

-- Save a trade and its leak tags in one database transaction. This prevents a trade
-- from being committed without its tags if the second insert fails. The final tag
-- receives any rounding remainder so a $100 loss split three ways still totals $100.00.
create or replace function public.log_trade(
  p_symbol text,
  p_direction text,
  p_entry_price numeric,
  p_exit_price numeric,
  p_net_pnl numeric,
  p_strategy_tag text,
  p_risk_reward numeric default null,
  p_leak_tags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trade_id uuid;
  v_tag text;
  v_tag_count integer := coalesce(array_length(p_leak_tags, 1), 0);
  v_tag_index integer := 0;
  v_total_loss numeric(20,2) := case when p_net_pnl < 0 then abs(p_net_pnl)::numeric(20,2) else 0 end;
  v_base_loss numeric(20,2) := 0;
  v_remainder numeric(20,2) := 0;
begin
  insert into public.trades (
    symbol,
    direction,
    entry_price,
    exit_price,
    net_pnl,
    strategy_tag,
    risk_reward
  ) values (
    upper(trim(p_symbol)),
    p_direction,
    p_entry_price,
    p_exit_price,
    p_net_pnl,
    p_strategy_tag,
    p_risk_reward
  )
  returning id into v_trade_id;

  if v_tag_count > 0 then
    v_base_loss := trunc(v_total_loss / v_tag_count, 2);
    v_remainder := v_total_loss - (v_base_loss * v_tag_count);

    foreach v_tag in array p_leak_tags loop
      v_tag_index := v_tag_index + 1;

      insert into public.trade_leaks (trade_id, leak_tag, loss_amount)
      values (
        v_trade_id,
        v_tag,
        v_base_loss + case when v_tag_index = v_tag_count then v_remainder else 0 end
      );
    end loop;
  end if;

  return v_trade_id;
end;
$$;

revoke all on function public.log_trade(text, text, numeric, numeric, numeric, text, numeric, text[]) from public;
grant execute on function public.log_trade(text, text, numeric, numeric, numeric, text, numeric, text[]) to anon, authenticated, service_role;
