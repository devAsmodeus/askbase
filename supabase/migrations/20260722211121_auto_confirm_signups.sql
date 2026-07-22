-- MVP: auto-confirm email signups (no SMTP configured; replace with real
-- email confirmation before production use)
create or replace function public.auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  new.email_confirmed_at = coalesce(new.email_confirmed_at, now());
  return new;
end $$;

create trigger auto_confirm_on_signup
  before insert on auth.users
  for each row execute function public.auto_confirm_user();
