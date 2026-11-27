-- Control de Gastos — migración 05: conceder permisos (GRANTs) a authenticated
-- Aplica después de 20261128000000_fix_rls_recursion.sql.
--
-- Problema: en la base de datos real, leer como usuario autenticado
-- daba "ERROR: 42501: permission denied for table months" y la app
-- mostraba "No se pudieron cargar los datos".
--
-- Causa: la migración 01 creó las tablas y activó RLS, pero NUNCA
-- concedió privilegios sobre ellas. Las policies decían quién puede
-- ver qué, pero ningún rol tenía la llave para leer la tabla: ni
-- anon, ni authenticated, ni service_role tenían SELECT, INSERT,
-- UPDATE ni DELETE en ninguna de las 5 tablas. PostgREST consulta
-- como `authenticated`, así que no podía leer nada.
--
-- (Por qué la primera prueba dio recursión y no este error: Postgres
-- detecta la recursión al reescribir la consulta, antes de comprobar
-- los permisos; al quitar la recursión en la migración 04 salió a la
-- luz el permiso que faltaba.)
--
-- Solución: conceder los privilegios que faltan. RLS sigue mandando:
-- el GRANT solo da la llave para tocar la tabla; la policy decide
-- qué filas ve o escribe cada usuario. Escribir en manager_members
-- sin ser admin, o tocar gastos de otro, sigue bloqueado por RLS.
--
-- A `anon` no se le concede nada sobre las tablas: la app exige
-- login y anon nunca consulta tablas.

-- Por si acaso (idempotente): poder usar el esquema public.
grant usage on schema public to anon, authenticated, service_role;

-- Lectura y escritura para el usuario que ha iniciado sesión.
-- RLS filtra por fila: lo propio, admin todo, manager sus subordinados.
grant select, insert, update, delete on
  public.profiles,
  public.months,
  public.expenses,
  public.topups,
  public.manager_members
to authenticated;

-- Lo mismo para service_role (herramientas de administración;
-- service_role salta RLS, como siempre).
grant select, insert, update, delete on
  public.profiles,
  public.months,
  public.expenses,
  public.topups,
  public.manager_members
to service_role;

-- Las funciones que la app llama por RPC, o que usa el login.
-- prevent_role_escalation() NO se concede: es función de trigger,
-- no se llama directamente.
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_my_subordinate(uuid) to authenticated;
grant execute on function public.get_top_spenders(uuid, integer) to authenticated;
grant execute on function public.create_next_month() to authenticated;
grant execute on function public.delete_last_month() to authenticated;
