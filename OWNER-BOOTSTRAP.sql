-- iBAGENCY OWNER ACCESS BOOTSTRAP
-- Run this in Supabase SQL Editor for project jkwhnahxkmqzplgvpbre
-- while signed in as the project owner.
--
-- This grants owner-dashboard access only to the Supabase Auth user whose
-- email matches the address below. If the owner account was created with a
-- different email, change the address before running this script.
-- Never run a bootstrap script supplied by an untrusted third party.

do $$
declare
  owner_user_id uuid;
  owner_email text := 'ibagency@gmail.com';
begin
  select id
    into owner_user_id
    from auth.users
   where lower(email) = lower(owner_email)
   order by created_at asc
   limit 1;

  if owner_user_id is null then
    raise exception 'No Supabase Auth user found for %. Create the owner login first, then update owner_email in this script and run it again.', owner_email;
  end if;

  insert into public.ibagency_admins (user_id)
  values (owner_user_id)
  on conflict (user_id) do nothing;

  raise notice 'iBAGENCY owner access is enabled for % (user UUID: %).', owner_email, owner_user_id;
end
$$;

-- Optional verification: should return one row for the owner account.
select a.user_id, u.email, a.created_at as owner_access_created_at
from public.ibagency_admins a
join auth.users u on u.id = a.user_id
where lower(u.email) = lower('ibagency@gmail.com');
