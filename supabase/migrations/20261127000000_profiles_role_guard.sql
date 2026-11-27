-- Control de Gastos — migración 03: impedir que un usuario se suba el rol
-- Aplica después de 20261126000000_top_spenders.sql.
--
-- Problema: la policy "own profile" (migración 01) deja a cada usuario
-- actualizar su propia fila de profiles, incluido el campo `role`.
-- Sin nada más, cualquiera podía ponerse role = 'admin' y verse todo.
--
-- Solución: trigger BEFORE INSERT OR UPDATE en profiles que solo deja
-- poner o cambiar el rol a quien YA es admin. El resto de cambios del
-- perfil propio (nombre, moneda) siguen funcionando igual.
--
-- Casos que permite:
--   * Crear el perfil propio con el rol por defecto ('member').
--   * Cambiar nombre o moneda sin tocar el rol.
--   * Un admin que asigna o cambia el rol de cualquiera (incluido el suyo).
--   * Trabajo directo en la base de datos (SQL Editor, service_role):
--     ahí auth.uid() es null y el trigger no bloquea nada.
--
-- Arranque del primer admin: como al principio no hay ningún admin, el
-- primer rol 'admin' se pone desde el SQL Editor de Supabase
-- (UPDATE profiles SET role = 'admin' WHERE id = '<uuid del usuario>';).
-- Después, ese admin ya puede asignar roles desde la app.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sin usuario de Auth (SQL Editor, service_role): trabajo directo del
  -- administrador de la base de datos, no escalada desde la app.
  if auth.uid() is null then
    return new;
  end if;

  -- Si el rol no cambia, no hay nada que proteger: el cambio es de
  -- nombre, moneda u otro campo del perfil propio.
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;

  -- Crear el perfil propio con el rol por defecto sigue funcionando.
  if tg_op = 'INSERT' and new.role = 'member' then
    return new;
  end if;

  -- Poner o cambiar el rol: solo quien ya es admin.
  if public.my_role() = 'admin' then
    return new;
  end if;

  raise exception 'Solo un administrador puede asignar o cambiar roles.';
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before insert or update on public.profiles
  for each row execute function public.prevent_role_escalation();
