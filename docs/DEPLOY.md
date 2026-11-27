# Deploy y vuelta atrás

## Entornos
| Entorno | URL | Rama | BD |
|---|---|---|---|
| Local | http://localhost:5173 (`npm run dev`) | cualquiera | local (seed.json) o Supabase de pruebas |
| Preview | (no hay todavía: llega con el primer deploy) | PR | pruebas |
| Producción | (sin URL todavía: se crea al lanzar el primer deploy) | main | Supabase (proyecto control-de-gastos) |

## Publicar
1. Deploy manual: merge a `main` con el CI en verde y luego, en el repo, Actions → Deploy a GitHub Pages → Run workflow (rama main). El build usa los secrets del repo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (solo los nombres; los valores nunca van en archivos).
2. Migraciones: aplicarlas en Supabase en el orden de los archivos (`20261124000000_init.sql`, después `20261126000000_top_spenders.sql` y después `20261127000000_profiles_role_guard.sql`), después de hacer backup si es arriesgada. Nunca se aplica una migración sin haberla probado antes en local o en un proyecto de pruebas.
3. Comprobar: abrir la URL y revisar los flujos críticos (cambiar de mes, ver los totales de ejemplo JUL–NOV, añadir un gasto de prueba y borrarlo).
4. Versión: tag `vX.Y.Z` + CHANGELOG (CHANGELOG.md se crea con la primera versión publicada).

## Volver atrás (rollback)
- Código: volver a publicar el deploy anterior desde el panel del hosting o `git revert` del PR.
- BD: migración nueva que corrige. Restaurar el backup solo en un caso grave (lo decide Augusto).
- Última prueba de rollback: (sin probar todavía).

## Backups
- Qué incluye el plan: (Supabase Free: backups automáticos diarios en el plan, sin restauración a un momento concreto en Free) · Exportación manual: exportar las tablas desde el panel de Supabase antes de cada migración arriesgada · Última restauración probada: (sin probar todavía)

## Servicios y límites (presupuesto)
| Servicio | Plan | Límites importantes | Dueño de la cuenta | Alertas |
|---|---|---|---|---|
| GitHub | Free | Repo público: 2.000 min de Actions/mes; Pages sí se activa (repo público) | augustoalr | no |
| GitHub Pages | — | Solo sirve archivos estáticos; no puede alojar un API. La app publica contra Supabase, no con el seed de demo | augustoalr | no |
| Supabase | Free | 2 proyectos activos, 500 MB de BD por proyecto, 50.000 usuarios al mes; **el proyecto se pausa a los 7 días sin actividad** (hay 90 días para restaurarlo) | risturiz73@gmail.com (cuenta nueva, proyecto control-de-gastos ya creado) | no |

## Monitorización
- Errores: (sin herramienta todavía) · Disponibilidad: (sin herramienta todavía) · Quién recibe las alertas: Augusto
