# Arquitectura — Control de Gastos Dashboard (MVP v0.1.0)

Producto: dashboard personal de gastos en AED. Un usuario, meses EXP1…
(EXPn), 5 categorías fijas, recargas, saldo y Report acumulado.
Diseño verificado: maqueta `control-de-gastos-maqueta-dashboard`
(paleta, layout 3 columnas, datos reales jul–nov 2026).

## 1. Decisión central

**No hay servidor propio en el MVP. El backend es Supabase (BaaS).**

```
┌─────────────────┐      HTTPS       ┌──────────────────────┐
│  GitHub Pages   │ ───────────────► │  Supabase            │
│  SPA estática   │  @supabase/js    │  Postgres + Auth     │
│  Vite + React   │  (anon key)      │  + RLS + PostgREST   │
│  + TS           │                  │  + RPCs + vistas     │
└─────────────────┘                  └──────────────────────┘
        │                                      │
        │ VITE_DATA_SOURCE=local               │ VITE_DATA_SOURCE=supabase
        ▼                                      ▼
  public/data/seed.json               Tablas months/expenses/topups
  + localStorage (demo)               + month_summary / report_ledger
```

¿Por qué? GitHub Pages solo sirve archivos estáticos: no puede alojar
un API Node/Express. Un servidor propio obligaría a otro hosting, coste
y operaciones. Supabase da Postgres, Auth, RLS y API REST generada
(PostgREST) sin servidor que mantener, y escala a miles de usuarios
sin reescribir la UI. Cuando el producto necesite lógica que no cabe
en la BD (exportar Excel idéntico a la hoja), se añade una Edge
Function, no un monolito.

**Contrato que hace escalable el MVP:** la UI solo habla con
`DataProvider` (`src/lib/dataProvider.ts`). Hoy hay dos implementaciones
(`LocalProvider`, `SupabaseProvider`) con el mismo contrato. Mañana,
una API REST propia sería un tercer proveedor, sin tocar ni un componente.

## 2. Principios

1. **La BD es la fuente de verdad.** Totales, saldo y Report se
   *calculan* (vistas `month_summary`, `report_ledger`), no se guardan.
   Si dos clientes escriben a la vez, la BD sigue cuadrando.
2. **Dinero en céntimos enteros.** Nunca `float` para AED.
   `291,35 AED = 29135`. El formato con coma decimal es solo presentación.
3. **Reglas en la BD, no solo en el cliente.** Máx. 16 gastos/mes y
   fecha dentro del mes se imponen con un trigger; el cliente valida
   también, para dar un error rápido, pero no es la defensa.
4. **Seguridad por RLS, no por ocultar rutas.** La anon key es pública
   por diseño; cada fila lleva `user_id` y las policies exigen
   `user_id = auth.uid()`. La `service_role` nunca entra al frontend.
5. **Datos aparte de la UI.** `public/data/seed.json` tiene la misma
   forma que `getDashboard()`; Supabase devuelve esa misma forma.
6. **Sin dependencias pesadas.** Gráficos en SVG nativo, sin librería
   de charts: menos bundle, Pages más rápido, menos superficie de fallo.

## 3. Estructura de archivos

```
control-de-gastos-dashboard/
├── index.html                  # SPA, Inter, <div id="root">
├── package.json                # react 19, @supabase/supabase-js
├── vite.config.ts              # base './' (Pages, ruta de proyecto)
├── tsconfig*.json
├── .env.example                # VITE_DATA_SOURCE / SUPABASE_URL / ANON_KEY
├── .github/workflows/deploy-pages.yml   # build + deploy a Pages
├── public/data/seed.json       # Datos de ejemplo jul-nov 2026 (34 gastos)
├── src/
│   ├── main.tsx                # StrictMode + App
│   ├── App.tsx                 # <Dashboard />
│   ├── index.css               # Paleta del diseñador, layout, responsive
│   ├── vite-env.d.ts
│   ├── types.ts                # Month, Expense, Topup, Report, CATEGORIES (5)
│   ├── lib/
│   │   ├── money.ts            # formatAED (coma decimal), formatPct, toCents
│   │   ├── supabase.ts         # createClient (anon) o null si no hay env
│   │   ├── dataProvider.ts     # CONTRATO + LocalProvider + SupabaseProvider
│   │   └── api.ts              # Validación + fachada que usa la UI
│   ├── hooks/useDashboard.ts   # Estado del servidor (carga/error/recarga)
│   ├── components/
│   │   ├── Sidebar.tsx         # Panel / Meses / Gastos / Recargas / Metas / Report
│   │   ├── MonthSelector.tsx   # JUL…NOV + DIC deshabilitado (EXP6)
│   │   ├── ExpenseChart.tsx    # Barras gastos + línea rosa recargas
│   │   ├── Donut.tsx           # Donut SVG (% gastado, desglose)
│   │   ├── ExpenseTable.tsx    # Lista del mes, editar / eliminar
│   │   ├── ExpenseForm.tsx     # Añadir / editar gasto
│   │   ├── TopupForm.tsx       # Registrar recarga
│   │   ├── ReportPanel.tsx     # Desglose + Report acumulado (derecha)
│   │   └── categoryColors.ts   # Color por categoría (paleta del diseñador)
│   └── pages/Dashboard.tsx     # Composición: KPIs, gráficos, tabla, acciones
└── supabase/
    ├── config.toml
    ├── migrations/20261124000000_init.sql   # Esquema + RLS + vistas + RPCs
    └── seed.sql                # Semilla SQL (sustituir el user_id)
```

## 4. Esquema de base de datos (Postgres)

```sql
-- Enum: 5 categorías reales. "Fuel, Parking & Salik" es UNA.
create type expense_category as enum (
  'Pantry & Grocery', 'Fuel, Parking & Salik', 'Food Expenses',
  'Printing & Stationery', 'Other Expenses');

profiles (id uuid PK -> auth.users, display_name, currency='AED', created_at)
months   (id uuid PK, user_id -> auth.users, seq int, tab text, label,
          short_label, from_date, to_date, ref_no, opening_cents int,
          unique (user_id, seq), unique (user_id, tab))
expenses (id uuid PK, user_id, month_id -> months cascade,
          date, amount_cents int check > 0, category expense_category,
          created_at, updated_at)
topups   (id uuid PK, user_id, month_id -> months cascade,
          date, amount_cents int check > 0, description, created_at)
```

Derivados (vistas, no tablas):

```sql
month_summary AS
  SELECT m.*, total_cents, recargas_cents,
         opening_cents + recargas_cents - total_cents AS saldo_cents
  FROM months m LEFT JOIN (sum expenses) LEFT JOIN (sum topups);

report_ledger AS
  -- topups (recibos) UNION totales mensuales (gastos),
  -- running_cents = sum() OVER (PARTITION BY user_id ORDER BY date)
```

Reglas (triggers / funciones):

| Regla | Dónde |
|---|---|
| Máx. 16 gastos por mes | trigger `validate_expense()` |
| Fecha dentro del mes | trigger `validate_expense()` |
| `updated_at` automático | trigger `set_updated_at()` |
| Crear mes siguiente (EXPn+1, apertura = saldo anterior) | RPC `create_next_month()` |
| Borrar solo el último mes | RPC `delete_last_month()` |
| Nadie se sube el rol solo (los roles de otros solo se asignan desde el SQL Editor) | trigger `profiles_role_guard()` (migración 03) |

RLS (las 4 tablas): `FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())`. En `profiles`, `id = auth.uid()`.

El rol vive en `profiles.role` (`admin`, `manager`, `member`, `viewer`, por defecto `member`). La policy "own profile" deja a cada usuario actualizar su propia fila, así que el rol lo protege el trigger `profiles_role_guard()` (migración 03): poner o cambiar `role` solo lo puede hacer quien ya es admin; crear el perfil con el rol por defecto y cambiar nombre o moneda siguen funcionando. El primer admin se nombra desde el SQL Editor (`UPDATE profiles SET role = 'admin' WHERE id = '…'`), porque al principio no hay ningún admin. Los roles de otros usuarios se asignan siempre desde el SQL Editor: la app no tiene pantalla para asignar roles y la policy "own profile" solo deja a cada usuario tocar su propia fila.

Datos de ejemplo que validan el esquema (34 gastos inventados, jul–nov 2026):

| Mes | Gastos | Apertura | Recarga | Saldo | % gastado |
|---|---|---|---|---|---|
| JUL EXP1 | 184,20 | 500,00 | 0 | 315,80 | 36,8% |
| AGO EXP2 | 312,45 | 815,80 | 0 | 503,35 | 38,3% |
| SEP EXP3 | 245,80 | 503,35 | 0 | 257,55 | 48,8% |
| OCT EXP4 | 368,90 | 757,55 | 0 | 388,65 | 48,7% |
| NOV EXP5 | 291,35 | 888,65 | 500,00 | **597,30** | **32,8%** |

Report acumulado: recibos 2.000,00 — gastos 1.402,70 — saldo 597,30.
Noviembre: Pantry 198,60 (68,2%), Food 34,40 (11,8%), Fuel 12,30 (4,2%), Printing 18,90 (6,5%), Other 27,15 (9,3%).

## 5. Endpoints de API

No hay servidor propio: la API es **PostgREST (Supabase) + RPCs**.
La capa `src/lib/api.ts` es la fachada que usa la UI; la tabla es
el contrato que esa fachada cumple en ambos proveedores.

| Operación | Método / RPC | Autenticación | Body / respuesta |
|---|---|---|---|
| Listar dashboard | `GET /rest/v1/months?select=*&order=seq` + `expenses` + `topups` | Bearer (Auth) + RLS | `DashboardData` |
| Añadir gasto | `POST /rest/v1/expenses` | Bearer + RLS | `{month_id, date, amount_cents, category}` → `Expense` (201; 409 si >16) |
| Editar gasto | `PATCH /rest/v1/expenses?id=eq.<id>` | Bearer + RLS | mismos campos → `Expense` |
| Borrar gasto | `DELETE /rest/v1/expenses?id=eq.<id>` | Bearer + RLS | 204 |
| Registrar recarga | `POST /rest/v1/topups` | Bearer + RLS | `{month_id, date, amount_cents, description}` → `Topup` |
| Crear mes siguiente | `POST /rest/v1/rpc/create_next_month` | Bearer + RLS | `{}` → `Month` (EXPn+1) |
| Borrar último mes | `POST /rest/v1/rpc/delete_last_month` | Bearer + RLS | `{}` → 204 (400 si es el único) |
| Report acumulado | Vista `report_ledger` (`GET /rest/v1/report_ledger`) | Bearer + RLS | `ReportRow[]` con `running_cents` |
| Top acumulado | `POST /rest/v1/rpc/get_top_spenders` | Bearer + RLS | `{p_month_id: uuid \| null, p_limit: 10}` → `TopSpender[]`. `null` = total acumulado. Solo devuelve a quien puedes ver (tú, admin/viewer, o tus subordinados en `manager_members`). |

Errores: validación del cliente (400, mensaje en español) y de la BD
(trigger: 409 / 400 con el mensaje del trigger). La UI muestra el
mensaje tal cual, sin inventar códigos.

**Fase 2 (no en el MVP):** `POST /functions/v1/export-month`
(Edge Function) para el Excel idéntico a la hoja (7 pestañas, fórmulas)
y el PDF solo del mes, como en la app original. En el MVP la
exportación es CSV del mes desde el navegador.

## 6. Arquitectura de la interfaz

```
Dashboard (pages/Dashboard.tsx)          ← única página del MVP
├── Sidebar                             ← navegación (sin router aún)
├── Topbar + MonthSelector               ← mes en estado local, por defecto EXP5
├── KPIs (4 tarjetas)                    ← Saldo / Gastos / Recarga / % gastado
├── ExpenseChart                         ← barras + recarga (SVG/divs)
├── Donut (% gastado) + Donut (categorías) + Meta del mes
├── ExpenseTable + ExpenseForm + TopupForm
│   └── Acciones: crear mes, borrar último mes, CSV del mes
└── ReportPanel (derecha)                ← Top acumulado + desglose + Report
    └── TopAcumulado                      ← ranking Mes / Total, solo totales
```

Flujo de datos:

```
UI event -> api.ts (valida) -> provider (local | Supabase)
  -> mutación -> refresh() -> useDashboard -> re-render
```

Estado: servidor en `useDashboard` (carga/error/recarga); UI local
en `useState` (mes, formularios). Sin estado global: el MVP no lo
necesita y añadirlo ahora sería sobre-ingeniería. Cuando haya Auth
y varias páginas, el paso es: React Query para el servidor +
Context solo para la sesión.

Responsive (diseño): desktop 3 columnas (220px / 1fr / 320px);
≤1100px el panel derecho baja; ≤720px sidebar a barra superior,
KPIs a 1 columna. Paleta y tipografía del diseñador:
fondo `#070D1A`, tarjeta `#101E33`, texto `#EAF0F8`,
secundario `#8A9BB3`, azul `#3B82F6`, rosa `#EC4899`,
verde `#34D399`, rojo `#F87171`, ámbar `#F59E0B`. Inter 400/600/700/800,
cifras en `tabular-nums`, coma decimal.

## 7. Qué NO hace el MVP (a propósito)

- Auth en la UI (T-06): pantalla de login (correo + contraseña, Supabase
  Auth), sesión persistente, rutas protegidas en modo Supabase y modo
  local sin login (demo con datos de ejemplo). El rol (profiles.role)
  decide el selector "ver los gastos de…" y el drill-down del Top; un
  viewer solo ve totales vía RPC, nunca el detalle de otros (RLS manda).
- Sin exportar Excel/PDF idéntico: es una Edge Function, no un botón
  del cliente. El MVP exporta CSV del mes.
- Sin multi-usuario en la UI: la BD ya es multi-usuario por RLS.
- Sin tests automatizados: el MVP se verifica con `npm run build`
  + revisión manual de los totales contra `seed.json` (ver README).
  Los tests (Vitest + Playwright) son el primer paso de Fase 2.

## 8. Escalado (hoja de ruta)

1. **Fase 2:** Edge Function de export Excel/PDF,
   tests Vitest + Playwright, React Query.
2. **Fase 3:** multi-mes en URL (`?month=EXP5`), metas con cifra,
   presupuestos por categoría, Realtime de Supabase.
3. **Fase 4:** API propia (si Supabase se queda corto) detrás del
   mismo `DataProvider`; la UI no cambia. Multi-tenant real,
   auditoría, backups.
