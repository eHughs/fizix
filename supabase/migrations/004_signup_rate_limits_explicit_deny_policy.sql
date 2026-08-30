create policy "signup rate limits deny client access"
on public.signup_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
