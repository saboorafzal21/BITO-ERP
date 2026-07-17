-- =====================================================================
-- BITO ERP — Fix auth trigger search_path (Migration 0007)
-- handle_new_auth_user ran under GoTrue's own DB role, whose search_path
-- does not include "public" by default. The unqualified ::user_role cast
-- failed silently there even though it worked fine in the SQL editor
-- (which defaults search_path to include public), causing every real
-- signup to fail with "Database error saving new user".
-- =====================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'cashier'::public.user_role)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
