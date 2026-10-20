-- HOW TO CREATE YOUR FIRST ADMIN
-- 1. Sign up normally at http://localhost:3000/signup (confirm the email if Supabase asks).
-- 2. Open Supabase Dashboard -> SQL Editor, replace YOUR_EMAIL_HERE, and run ONE of the options below.
-- 3. Log in at http://localhost:3000/admin/login

-- Option A (normal case: your profile row already exists)
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');

-- Option B (only if Option A says "0 rows" because no profile row exists yet)
-- insert into public.profiles (id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_EMAIL_HERE'
-- on conflict (id) do update set role = 'admin';

-- Check the result
select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';

-- SECURITY CHECK: make sure students cannot promote themselves.
-- Look at the policies on profiles; no UPDATE/INSERT policy should let a user write their own "role".
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';
