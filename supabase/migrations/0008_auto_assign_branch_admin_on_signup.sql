-- =====================================================================
-- BITO ERP — Auto-assign branch + admin role on signup (Migration 0008)
-- WARNING: Signup is public. This grants every new signup admin-level
-- access to the default branch automatically. Only safe while signup
-- is restricted to trusted people; revisit before opening this up
-- broadly (e.g. gate signup, or default to a lower-privilege role).
-- =====================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'admin'::public.user_role),
    (select id from public.branches order by created_at asc limit 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
