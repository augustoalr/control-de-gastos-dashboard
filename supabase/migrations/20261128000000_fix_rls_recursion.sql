-- Control de Gastos — migración 04: romper la recursión infinita en RLS
-- Aplica después de 20261127000000_profiles_role_guard.sql.
--
-- Problema: en la base de datos real, leer months/expenses/topups como
-- usuario autenticado daba "ERROR: 42P17: infinite recursion detected
-- in policy for relation manager_members", y la app mostraba
-- "No se pudieron cargar los datos".
--
-- Causa: las policies se llamaban entre sí en círculo. `profiles_read_visible`
-- tenía un EXISTS sobre `manager_members`, y `manager_members_read` tenía
-- un EXISTS sobre `profiles` (para comprobar si el usuario es admin). Al
-- leer months/expenses/topups, sus policies consultaban `manager_members`,
-- que disparaba la policy de `manager_members`, que consultaba `profiles`,
-- que disparaba la policy de `profiles`, que volvía a consultar
-- `manager_members`... y Postgres cortaba con recursión infinita.
--
-- Solución: las comprobaciones que cruzan de una tabla a otra ya no se
-- hacen con EXISTS dentro de la policy, sino con dos funciones
-- `security definer` (que leen la tabla saltando RLS, como ya hacía
-- `my_role()`), así el ciclo se rompe:
--   * `public.my_role()` (ya existía): para comprobar si eres admin.
--   * `public.is_my_subordinate(p_user)` (nueva): para comprobar si
--     p_user es subordinado tuyo en `manager_members`.
--
-- No cambia quién puede ver qué: lo propio, admin todo, manager sus
-- subordinados; el viewer sigue sin ver el detalle gasto a gasto, solo
-- totales por la RPC `get_top_spenders()`. Las policies "own ...", el
-- trigger de roles, `my_role()` y `get_top_spenders()` no se tocan.

-- ¿Es este usuario subordinado mío? Lee manager_members saltando RLS
-- (security definer), igual que my_role() lee profiles. Así la policy
-- que la llama no vuelve a entrar en manager_members.
create or replace function public.is_my_subordinate(p_user uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.manager_members
    where manager_id = auth.uid() and member_id = p_user
  );
$$;

-- manager_members_read: la comprobación de admin ya no consulta
-- profiles con EXISTS (eso disparaba profiles_read_visible, que a su
-- vez consultaba manager_members); ahora usa my_role(), que salta RLS.
drop policy if exists "manager_members_read" on public.manager_members;
create policy "manager_members_read" on public.manager_members
  for select using (
    manager_id = auth.uid()
    or member_id = auth.uid()
    or public.my_role() = 'admin'
  );

-- manager_members_admin_write: misma sustitución en USING y WITH CHECK.
drop policy if exists "manager_members_admin_write" on public.manager_members;
create policy "manager_members_admin_write" on public.manager_members
  for all using (
    public.my_role() = 'admin'
  ) with check (
    public.my_role() = 'admin'
  );

-- expenses_read_visible: el EXISTS sobre manager_members se sustituye
-- por is_my_subordinate(), que lee saltando RLS y rompe el ciclo.
drop policy if exists "expenses_read_visible" on public.expenses;
create policy "expenses_read_visible" on public.expenses
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or public.is_my_subordinate(expenses.user_id)
  );

-- months_read_visible: misma sustitución.
drop policy if exists "months_read_visible" on public.months;
create policy "months_read_visible" on public.months
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or public.is_my_subordinate(months.user_id)
  );

-- topups_read_visible: misma sustitución.
drop policy if exists "topups_read_visible" on public.topups;
create policy "topups_read_visible" on public.topups
  for select using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
    or public.is_my_subordinate(topups.user_id)
  );

-- profiles_read_visible: el EXISTS sobre manager_members se sustituye
-- por is_my_subordinate(profiles.id). Era el otro lado del círculo.
drop policy if exists "profiles_read_visible" on public.profiles;
create policy "profiles_read_visible" on public.profiles
  for select using (
    id = auth.uid()
    or public.my_role() = 'admin'
    or public.is_my_subordinate(profiles.id)
  );
