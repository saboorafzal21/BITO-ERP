-- =====================================================================
-- BITO ERP — Auth sync trigger (Migration 0005)
-- Creates a row in public.users whenever a new auth.users row appears.
-- Role/branch default to 'cashier' / null and must be set by an owner/admin
-- afterwards (see src/lib/actions/users.ts).
-- =====================================================================

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cashier')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();
