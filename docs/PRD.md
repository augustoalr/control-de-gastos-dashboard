# PRD — Control de Gastos Dashboard
Versión: 0.1 · Estado: borrador (pendiente de aprobación por Augusto)

## 1. Problema
Augusto registra sus gastos en un Excel (Expense_Report, hojas EXP1…EXPn) y en una app de prueba conectada a Google Sheets. Ver los gastos por mes, el saldo y cuánto gasta cada persona exige abrir el Excel y hacer las cuentas a mano. No hay una vista rápida que diga: cuánto gasté este mes, cuánto me queda y quién gasta más.

## 2. Usuarios
- Principal: Augusto López Ramos, en Dubái. Usa el dashboard para ver sus gastos por mes (jul–nov 2026 y siguientes), añadir/editar/borrar gastos y recargas, y ver su saldo. Prueba la app como usuario y decide producto, dinero y cuentas.
- Secundario: sus subordinados. Cada uno tiene su perfil con sus gastos. Un manager ve los gastos de sus subordinados y un Top acumulado por persona; un viewer solo ve totales; un admin ve y gestiona todo. Los roles se guardan en `profiles.role` (`admin`, `manager`, `member`, `viewer`) y se hacen cumplir en la base de datos (RLS), nunca solo en la pantalla.

## 3. Propuesta de valor
En una pantalla, Augusto ve cuánto gastó, cuánto le queda y quién gasta más, con sus datos reales y sin tocar el Excel.

## 4. MVP (lo mínimo para probar la idea)
1. Dashboard con selector de mes (JUL–NOV, DIC como EXP6 deshabilitado), 4 indicadores (saldo, gastos, recarga, % gastado), barras de gastos + línea de recargas, donut de % gastado y donut de categorías.
2. Tabla de gastos del mes con añadir/editar/borrar gasto y añadir recarga; crear/borrar mes (máximo 16 gastos por mes).
3. Report acumulado (recibos, gastos, saldo) y desglose por categoría.
4. Top acumulado a un lado, con cambio de vista Mes / Total (componente `TopAcumulado.tsx`, RPC `get_top_spenders`).
5. Datos de ejemplo: 34 gastos jul–nov 2026 (JUL 184,20 / AGO 312,45 / SEP 245,80 / OCT 368,90 / NOV 291,35 AED; saldo 597,30 AED). 5 categorías fijas, Pantry & Grocery por defecto.
6. Backend Supabase (Postgres + Auth + RLS) con `DataProvider` local/Supabase; dinero en céntimos enteros.

## 5. Fuera de alcance (por ahora)
- Sin Auth UI todavía (sin pantalla de inicio de sesión; la sesión y los roles llegan en T-06).
- Sin export Excel/PDF idéntico al Excel original (el MVP solo exporta CSV del mes; el Excel/PDF es Fase 2, con una Edge Function).
- Sin tests automatizados (Fase 2: Vitest + Playwright).
- Sin notificaciones, sin presupuestos por categoría con alertas, sin multi-moneda (solo AED).

## 6. Requisitos
- Funcionales: RF-01 el usuario ve sus gastos por mes; RF-02 añade, edita y borra gastos y recargas; RF-03 crea el mes siguiente con el saldo anterior como inicial; RF-04 ve el Top acumulado por persona (Mes / Total); RF-05 un manager ve solo a sus subordinados; RF-06 exporta el mes en CSV.
- No funcionales: español simple en la interfaz; funciona en móvil (responsive 3→2→1 columnas); dinero en céntimos enteros; totales calculados en la BD, no guardados; sin secretos en el frontend (nunca service_role).

## 7. Plataforma y stack
- Web (SPA estática) — Vite + React 19 + TypeScript + Supabase (Postgres + Auth + RLS) + GitHub Pages en el futuro — motivo: sin servidor propio, gratis en Free, y el mismo código sirve en local y en Supabase cambiando `VITE_DATA_SOURCE` (detalle en docs/ARCHITECTURE.md).

## 8. Restricciones
- Presupuesto: cero (Supabase Free, GitHub Free) · Plazo: sin fecha fija · Datos sensibles: sí, gastos personales reales de Augusto (el repo es privado por eso; el seed local lleva datos reales).

## 9. Criterio de éxito
- Augusto abre el dashboard, cambia de mes, ve los totales reales de ese mes (iguales que en el Excel) y el Top Mes/Total, y añade un gasto de prueba que aparece en el total.

## 10. Riesgos
- Supabase Free pausa el proyecto a los 7 días sin actividad → mitigación: entrar y generar actividad cada semana, o pasar a Pro (25 $/mes) cuando haya usuarios reales.
- Repo privado Free no activa GitHub Pages → mitigación: publicar con seed de demo en repo público, o desplegar desde el repo privado en Vercel/Netlify (ver docs/DEPLOY.md).
- Datos reales en el seed local → mitigación: repo privado, nunca hacer público con el seed real (ver SECURITY.md).
- Sin Auth UI todavía → mitigación: el MVP local solo tiene a Augusto; la multiusuario real llega con T-06 y Revisor en lo delicado.
