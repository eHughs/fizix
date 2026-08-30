create table if not exists public.signup_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

comment on table public.signup_rate_limits is
  'Backend-only signup abuse throttle. Stores an HMAC of the request IP, never the raw IP.';

create index if not exists signup_rate_limits_ip_created_at_idx
  on public.signup_rate_limits (ip_hash, created_at desc);

alter table public.signup_rate_limits enable row level security;

revoke all on public.signup_rate_limits from anon, authenticated;
grant select, insert, delete on public.signup_rate_limits to service_role;
