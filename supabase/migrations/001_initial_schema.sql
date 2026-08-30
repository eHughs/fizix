create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_currency text not null default 'USD',
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  description text,
  entry_rules text,
  exit_rules text,
  risk_rules text,
  market_conditions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.leaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  symbol text not null check (char_length(symbol) between 1 and 20),
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(20,8) not null check (entry_price >= 0),
  exit_price numeric(20,8) not null check (exit_price >= 0),
  position_size numeric(20,8),
  stop_loss numeric(20,8),
  take_profit numeric(20,8),
  net_pnl numeric(20,2) not null,
  r_multiple numeric(10,4),
  strategy_id uuid references public.strategies(id) on delete set null,
  strategy_tag text not null,
  risk_reward numeric(10,4),
  outcome text check (outcome is null or outcome in ('Win', 'Loss', 'Breakeven')),
  trade_date date not null default current_date,
  trade_time time not null default localtime,
  session text,
  notes text,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trade_leaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  leak_id uuid references public.leaks(id) on delete cascade,
  leak_tag text not null,
  loss_amount numeric(20,2) not null default 0 check (loss_amount >= 0),
  created_at timestamptz not null default now(),
  unique (trade_id, leak_tag)
);

create index trades_user_date_idx on public.trades(user_id, trade_date desc, created_at desc);
create index trades_user_strategy_idx on public.trades(user_id, strategy_id);
create index trades_user_symbol_idx on public.trades(user_id, symbol);
create index strategies_user_name_idx on public.strategies(user_id, name);
create index leaks_user_name_idx on public.leaks(user_id, name);
create index trade_leaks_user_trade_idx on public.trade_leaks(user_id, trade_id);
create index trade_leaks_user_leak_idx on public.trade_leaks(user_id, leak_id);

alter table public.profiles enable row level security;
alter table public.strategies enable row level security;
alter table public.leaks enable row level security;
alter table public.trades enable row level security;
alter table public.trade_leaks enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.strategies to authenticated;
grant select, insert, update, delete on public.leaks to authenticated;
grant select, insert, update, delete on public.trades to authenticated;
grant select, insert, update, delete on public.trade_leaks to authenticated;

create policy "Users read own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "Users insert own profile" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users read own strategies" on public.strategies
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own strategies" on public.strategies
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own strategies" on public.strategies
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own strategies" on public.strategies
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own leaks" on public.leaks
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own leaks" on public.leaks
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own leaks" on public.leaks
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own leaks" on public.leaks
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own trades" on public.trades
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own trades" on public.trades
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own trades" on public.trades
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own trades" on public.trades
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own trade leaks" on public.trade_leaks
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own trade leaks" on public.trade_leaks
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own trade leaks" on public.trade_leaks
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own trade leaks" on public.trade_leaks
for delete to authenticated using ((select auth.uid()) = user_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  );

  insert into public.strategies (user_id, name)
  values
    (new.id, 'Breakout'),
    (new.id, 'Reversal'),
    (new.id, 'Trend Following');

  insert into public.leaks (user_id, name)
  values
    (new.id, 'FOMO'),
    (new.id, 'Revenge trade'),
    (new.id, 'Overtrading'),
    (new.id, 'Moving stop'),
    (new.id, 'Oversizing'),
    (new.id, 'Stopped out early'),
    (new.id, 'Late entry'),
    (new.id, 'Breaking strategy rules'),
    (new.id, 'Trading outside planned session'),
    (new.id, 'Chasing');

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.log_trade(
  p_symbol text,
  p_direction text,
  p_entry_price numeric,
  p_exit_price numeric,
  p_net_pnl numeric,
  p_strategy_tag text,
  p_risk_reward numeric default null,
  p_leak_tags text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade_id uuid;
  v_strategy_id uuid;
  v_leak_id uuid;
  v_tag text;
  v_tag_count integer := coalesce(array_length(p_leak_tags, 1), 0);
  v_tag_index integer := 0;
  v_total_loss numeric(20,2) := case when p_net_pnl < 0 then abs(p_net_pnl)::numeric(20,2) else 0 end;
  v_base_loss numeric(20,2) := 0;
  v_remainder numeric(20,2) := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select id into v_strategy_id
  from public.strategies
  where user_id = v_user_id and lower(name) = lower(trim(p_strategy_tag))
  limit 1;

  if v_strategy_id is null then
    insert into public.strategies (user_id, name)
    values (v_user_id, trim(p_strategy_tag))
    returning id into v_strategy_id;
  end if;

  insert into public.trades (
    user_id, symbol, direction, entry_price, exit_price, net_pnl,
    strategy_id, strategy_tag, risk_reward, r_multiple,
    outcome, trade_date, trade_time
  ) values (
    v_user_id, upper(trim(p_symbol)), p_direction, p_entry_price, p_exit_price, p_net_pnl,
    v_strategy_id, trim(p_strategy_tag), p_risk_reward, p_risk_reward,
    case when p_net_pnl > 0 then 'Win' when p_net_pnl < 0 then 'Loss' else 'Breakeven' end,
    current_date, localtime
  ) returning id into v_trade_id;

  if v_tag_count > 0 then
    v_base_loss := trunc(v_total_loss / v_tag_count, 2);
    v_remainder := v_total_loss - (v_base_loss * v_tag_count);

    foreach v_tag in array p_leak_tags loop
      v_tag_index := v_tag_index + 1;

      select id into v_leak_id
      from public.leaks
      where user_id = v_user_id and lower(name) = lower(trim(v_tag))
      limit 1;

      if v_leak_id is null then
        insert into public.leaks (user_id, name)
        values (v_user_id, trim(v_tag))
        returning id into v_leak_id;
      end if;

      insert into public.trade_leaks (user_id, trade_id, leak_id, leak_tag, loss_amount)
      values (
        v_user_id,
        v_trade_id,
        v_leak_id,
        trim(v_tag),
        v_base_loss + case when v_tag_index = v_tag_count then v_remainder else 0 end
      );
    end loop;
  end if;

  return v_trade_id;
end;
$$;

revoke all on function public.log_trade(text,text,numeric,numeric,numeric,text,numeric,text[]) from public, anon;
grant execute on function public.log_trade(text,text,numeric,numeric,numeric,text,numeric,text[]) to authenticated;
