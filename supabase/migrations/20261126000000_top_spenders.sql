-- Control de Gastos — migración 02: roles, subordinados y Top acumulado
-- Aplica después de 20261124000000_init.sql.
-- Modelo elegido: subordinados directos (manager -> member), no equipos
-- genéricos. Es el modelo más simple que cubre "ver los gastos de mis
-- subordinados" y el Top, y se puede migrar a teams sin tocar la UI.

-- Rol en el perfil (el MVP inicial no lo tenía).
alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('admin', 'manager', 'member', 'viewer'));

-- Quién es subordinado de quién. Solo un admin puede escribir aquí
-- (ver policies abajo); un manager solo lee sus propias filas.
create table if not exists public.manager_members (
  manager_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (manager_id, member_id),
  check (manager_id <> member_id)
);

alter table public.manager_members enable row level security;

drop policy if exists "manager_members_read" on public.manager_members;
create policy "manager_members_read" on public.manager_members
  for select using (
    manager_id = auth.uid()
    or member_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "manager_members_admin_write" on public.manager_members;
create policy "manager_members_admin_write" on public.manager_members
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Leer tu propio rol sin recursión en RLS.
create or replace function public.my_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Top acumulado. p_month_id = null significa "total acumulado" (todos
-- los meses). p_limit por defecto 10. Solo devuelve a quien tienes
-- permiso de ver: tú mismo, todos si eres admin/viewer, o tus
-- subordinados si eres manager. Los totales se calculan en la BD.
create or replace function public.get_top_spenders(p_month_id uuid default null, p_limit int default 10)
returns table (user_id uuid, name text, total_cents int, expense_count int)
language sql security definer stable set search_path = public as $$
  select
    e.user_id,
    coalesce(p.display_name, 'Sin nombre'),
    sum(e.amount_cents)::int,
    count(*)::int
  from public.expenses e
  join public.profiles p on p.id = e.user_id
  where (p_month_id is null or e.month_id = p_month_id)
    and (
      e.user_id = auth.uid()
      or public.my_role() in ('admin', 'viewer')
      or exists (
        select 1 from public.manager_members mm
        where mm.manager_id = auth.uid() and mm.member_id = e.user_id
      )
    )
  group by e.user_id, p.display_name
  order by sum(e.amount_cents) desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

-- Ampliar la lectura para manager/admin, sin tocar la escritura
-- (que sigue siendo solo lo propio o admin). El viewer NO está aquí:
-- solo ve totales vía la RPC get_top_spenders, nunca el detalle
-- gasto a gasto. Las policies originales "own ..." siguen existiendo;
-- estas las complementan.
drop policy if exists "expenses_read_visible" on public.expenses;
create policy "expenses_read_visible" on public.expenses
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from public.manager_members mm
      where mm.manager_id = auth.uid() and mm.member_id = expenses.user_id
    )
  );

-- Misma regla de lectura para months y topups: sin ella el manager no
-- puede ver los meses ni las recargas de sus subordinados y getDashboard
-- los descarta. La escritura sigue siendo solo lo propio o admin.
drop policy if exists "months_read_visible" on public.months;
create policy "months_read_visible" on public.months
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from public.manager_members mm
      where mm.manager_id = auth.uid() and mm.member_id = months.user_id
    )
  );

drop policy if exists "topups_read_visible" on public.topups;
create policy "topups_read_visible" on public.topups
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from public.manager_members mm
      where mm.manager_id = auth.uid() and mm.member_id = topups.user_id
    )
  );

-- Misma regla para profiles: el manager necesita leer el perfil
-- (nombre) de sus subordinados para mostrarlo en el Top y el dashboard.
drop policy if exists "profiles_read_visible" on public.profiles;
create policy "profiles_read_visible" on public.profiles
  for select using (
    id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from public.manager_members mm
      where mm.manager_id = auth.uid() and mm.member_id = profiles.id
    )
  );
