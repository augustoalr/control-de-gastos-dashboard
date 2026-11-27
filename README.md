# Control de Gastos — Dashboard

Dashboard personal de gastos en AED, como el de la referencia
(Personal Finance, azul marino), adaptado a datos de ejemplo.
MVP de startup: mínimo, pero escalable.

**Estado:** v0.1.0 — funciona hoy en GitHub Pages sin backend
(datos de ejemplo jul–nov 2026 en `public/data/seed.json`) y está
preparado para Supabase sin reescribir la UI.

**Diseño:** maqueta del diseñador `control-de-gastos-maqueta-dashboard`
— sidebar, selector JUL–NOV, barras de gastos + línea rosa de
recargas, saldo en grande (597,30 AED en noviembre, 32,8% gastado),
donuts de % gastado y de categorías, lista de los
9 gastos de noviembre y panel derecho con desglose y Report.
Paleta exacta en `src/index.css`. Tipografía: Inter (la maqueta
construida usa Manrope; el MVP usa Inter, como proponía el diseñador).

## Datos de ejemplo (inventados, no reales)

| Mes | Gastos | Apertura | Recarga | Saldo |
|---|---|---|---|---|
| JUL EXP1 | 184,20 | 500,00 | 0 | 315,80 |
| AGO EXP2 | 312,45 | 815,80 | 0 | 503,35 |
| SEP EXP3 | 245,80 | 503,35 | 0 | 257,55 |
| OCT EXP4 | 368,90 | 757,55 | 0 | 388,65 |
| NOV EXP5 | 291,35 | 888,65 | 500,00 | **597,30** |

5 categorías (corrección verificada: son 5, no 6):
Pantry & Grocery, Fuel, Parking & Salik, Food Expenses,
Printing & Stationery, Other Expenses.
Report acumulado: recibos 2.000,00 — gastos 1.402,70 — saldo 597,30.

Los datos reales no están en este repo: solo viven en Supabase
(privado, con RLS). Ver `SECURITY.md`.

## Arquitectura

Lee **`docs/ARCHITECTURE.md`** — es el documento de diseño:
decisión central (SPA estática + Supabase como BaaS, sin servidor
propio), principios, estructura de archivos, esquema de BD,
endpoints de API, arquitectura de la UI y hoja de ruta.

Resumen en una línea: la UI solo habla con el contrato
`DataProvider` (`src/lib/dataProvider.ts`). Hoy hay dos
implementaciones — `LocalProvider` (seed + localStorage) y
`SupabaseProvider` (Postgres + RLS) — y se cambia con una
variable de entorno. La BD es la fuente de verdad, el dinero
va en céntimos enteros y las reglas (máx. 16 gastos/mes)
viven en la BD, no solo en el cliente.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # genera dist/
npm run preview
```

Sin configurar nada, la app arranca en modo local con los datos
de ejemplo de `public/data/seed.json`. Los cambios que hagas en modo
local se guardan en tu navegador (localStorage).

## Despliegue en GitHub Pages

1. Crea el repo en GitHub (sugerido: `control-de-gastos-dashboard`)
   y sube este código a `main`.
2. En el repo: Settings → Pages → Source: **GitHub Actions**.
3. El workflow `.github/workflows/deploy-pages.yml` hace
   `npm ci && npm run build` y publica `dist/`.
   La URL será `https://augustoalr.github.io/control-de-gastos-dashboard/`.
   `vite.config.ts` ya usa `base: './'` para que funcione en ruta
   de proyecto.

## Conectar Supabase (cuando quieras)

1. Crea el proyecto en Supabase.
2. SQL Editor → pega `supabase/migrations/20261124000000_init.sql`
   (o `supabase db push` con la CLI).
3. Crea tu usuario en Authentication, copia su uuid y sustitúyelo
   en `supabase/seed.sql`; ejecútalo para cargar los datos de ejemplo
   jul–nov 2026.
4. Copia `.env.example` a `.env` y rellena:
   `VITE_DATA_SOURCE=supabase`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` (nunca la service_role).
5. `npm run dev` — la UI es la misma; los datos ya vienen de Postgres.
6. Para Pages con Supabase, define esos tres valores como secrets
   del repo y descomenta el bloque `env:` del workflow.

## Estructura

```
├── docs/ARCHITECTURE.md   # diseño completo del sistema
├── public/data/seed.json  # datos de ejemplo jul-nov 2026
├── src/                   # React + TS (App, pages, components, lib, hooks)
└── supabase/              # migración (esquema + RLS + vistas + RPCs) y semilla
```

## Lo que no hace el MVP (a propósito)

Sin login en la UI todavía (RLS ya está en la BD), sin exportar
Excel/PDF idéntico a la hoja (eso es una Edge Function de Fase 2;
el MVP exporta CSV del mes) y sin tests automatizados (primer
paso de Fase 2: Vitest + Playwright). Ver `docs/ARCHITECTURE.md §7–8`.
