# Seguridad — Control de Gastos Dashboard

Este repo es **público con datos de ejemplo inventados**. No contiene
ningún gasto real: los datos reales solo viven en Supabase (privado,
con RLS). Lee esto antes de activar Pages o de añadir colaboradores.

## 1. Repo

- **Público, con seed de demo.** `public/data/seed.json` y
  `supabase/seed.sql` tienen 34 gastos inventados (1.402,70 AED).
  Nunca se vuelve a poner un gasto real en el repo ni en su historial:
  el historial se limpió en T-08 (un solo commit) justo para hacerlo
  público. La copia de seguridad de los datos reales está fuera del
  repo (`~/workspace/cdg-real-seed/`, local) y nunca se commitea.
- **GitHub Pages:** en cuenta Free, Pages publica repos públicos, así
  que este repo ya se puede publicar. El workflow `deploy-pages.yml`
  está en el repo, pero solo se activa a mano (`workflow_dispatch`):
  no se dispara con cada push a main.
- **Colaboradores:** solo tú (`augustoalr`). Los colaboradores solo
  verían datos de ejemplo; los gastos reales están en Supabase con RLS.
- **Branch protection:** `main` protegida, sin push directo, cambios
  por PR. En repo público Free la regla sí se aplica (verificado en
  T-04: en privado no se aplicaba). La protección se activa en
  Settings → Branches, no está en el código.
- **Secret scanning:** activado en el repo. Si GitHub detecta una clave,
  rotala de inmediato en Supabase, no solo borres el commit.

## 2. Secretos — nunca en el código ni en git

- **Nunca** se commitea `.env`, `.env.local` ni ninguna variante.
  `.gitignore` cubre `.env*` (excepto `.env.example`, que solo tiene
  nombres de variables vacíos) y `*.tsbuildinfo`.
- El frontend solo usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  (variables de entorno). La **anon key es pública por diseño** en
  Supabase, pero solo sirve con RLS; sin RLS no protege nada.
- **La `service_role` key nunca entra al frontend, al repo, a GitHub
  Secrets de build ni a ningún archivo.** Solo se usa, si hace falta,
  en el servidor / SQL Editor de Supabase.
- En GitHub Actions, las claves van en Settings → Secrets → Actions,
  nunca hardcodeadas en `.github/workflows/*.yml`. El workflow actual
  las tiene comentadas y solo usa `VITE_DATA_SOURCE=local` por defecto.

## 3. Base de datos (Supabase)

- **RLS activado en todas las tablas** (`profiles`, `months`, `expenses`,
  `topups`, `manager_members`). Ver `supabase/migrations/`.
- Regla: cada usuario solo lee/escribe lo suyo (`user_id = auth.uid()`),
  salvo `admin` / `viewer` (lectura) y `manager` (lectura de sus
  subordinados en `manager_members`).
- El Top acumulado (`get_top_spenders`) es una RPC `security definer`
  que filtra por ese mismo permiso y **solo devuelve totales**,
  nunca el detalle gasto a gasto de otra persona.
- El seed SQL usa el placeholder `00000000-0000-0000-0000-000000000000`:
  sustitúyelo por tu uuid real de Auth antes de ejecutarlo.
- Dinero siempre en **céntimos enteros**; los totales se calculan en
  vistas/RPC, no se guardan.

## 4. Código

- Sin `eval`, sin `innerHTML` con datos de usuario, sin dependencias
  nuevas sin revisar. Dependencias fijadas por `package-lock.json`
  (`npm ci` en CI, nunca `npm install` sin lock).
- Los formularios validan en cliente (montos > 0, fecha dentro del mes,
  máximo 16 gastos/mes) **y** la base de datos vuelve a validar con
  triggers/checks. Nunca confíes solo en el cliente.
- Si un gasto, un mes o un topup se borra, es un DELETE real con
  confirmación en UI. No hay papelera en el MVP.

## 5. Si algo se filtra

1. Rota la clave afectada en Supabase (Settings → API → Rotate keys).
2. Revoca el token / sesión si es un login.
3. Borra el secreto del historial de git (no basta con un commit nuevo).
4. Revisa en Supabase → Authentication y en los logs quién accedió.
