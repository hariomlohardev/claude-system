-- Run this once in Supabase SQL Editor
create or replace function increment_downloads(sys_name text) returns void as $$
begin
  update systems set downloads = downloads + 1, updated_at = now() where name = sys_name;
  update system_versions set downloads = downloads + 1 where system_name = sys_name and version = (select version from systems where name = sys_name);
end; $$ language plpgsql security definer;

-- Allow anon to execute the function (no service_role needed on Vercel)
grant execute on function increment_downloads(text) to anon, authenticated;

-- Optional: ensure RLS policies allow read
-- Already have "public read" for select; function is security definer so it bypasses RLS for updates
