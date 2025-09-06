
-- 1) Roles: enum + user_roles table + helper function
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- 2) Grant admin-only INSERT/UPDATE/DELETE on content tables
-- Brands
create policy "Admins can insert brands"
  on public.brands
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update brands"
  on public.brands
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete brands"
  on public.brands
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Finishes
create policy "Admins can insert finishes"
  on public.finishes
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update finishes"
  on public.finishes
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete finishes"
  on public.finishes
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Colors
create policy "Admins can insert colors"
  on public.colors
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update colors"
  on public.colors
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete colors"
  on public.colors
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Door styles
create policy "Admins can insert door styles"
  on public.door_styles
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update door styles"
  on public.door_styles
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete door styles"
  on public.door_styles
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Cabinet types
create policy "Admins can insert cabinet types"
  on public.cabinet_types
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update cabinet types"
  on public.cabinet_types
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete cabinet types"
  on public.cabinet_types
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Cabinet parts
create policy "Admins can insert cabinet parts"
  on public.cabinet_parts
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update cabinet parts"
  on public.cabinet_parts
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete cabinet parts"
  on public.cabinet_parts
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Global settings
create policy "Admins can insert global settings"
  on public.global_settings
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update global settings"
  on public.global_settings
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete global settings"
  on public.global_settings
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 3) Optional: add per-color surcharge for door pricing
alter table public.colors
  add column if not exists surcharge_rate_per_sqm numeric not null default 0;
