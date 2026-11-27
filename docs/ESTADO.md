# ESTADO del proyecto

Última actualización: 2026-11-27 08:20 +04 (Asia/Dubái) por Manager (T-09 fusionada y app publicada en Pages)
Nivel de riesgo del proyecto: 3 · Modo profesor: SÍ · Lecciones: docs/APRENDIZAJE.md
Repo: https://github.com/augustoalr/control-de-gastos-dashboard (público, rama main; historial limpio)
Producción: https://augustoalr.github.io/control-de-gastos-dashboard/ (GitHub Pages, contra Supabase control-de-gastos)

## Ahora mismo
- En curso: prueba funcional de Augusto en la app publicada (login + ver sus gastos reales)
- Próxima tarea propuesta: T-10 — lo que salga de la prueba de Augusto (PASÓ / FALLÓ / NO PUDE PROBAR)

## Tabla de tareas

| Tarea | Conversación | Rama | Worktree | PR | Estado | Inicio | Merge | Rondas | Errores atrapados | Nota |
|---|---|---|---|---|---|---|---|---|---|---|
| T-01 Montaje manual | T-01 montaje manual | — (sin repo con commits todavía) | — (en serie) | — | 🔍 En revisión | 2026-11-26 | | 0 | 0 | Documentos + CI verificados por el Manager (build en verde); el snapshot que incluye está en T-07 |
| T-07 Correcciones del Revisor | T-07 correcciones Revisor | — | — (en serie) | — | ✅ Fusionada | 2026-11-26 | 2026-11-26 | 0 | 11 | Revisor 2ª revisión: APTO (11/11 corregidas, build en copia limpia en verde) |
| T-03 Subir snapshot inicial a main | — | main | — | — | ✅ Fusionada | 2026-11-26 | 2026-11-26 | 0 | 0 | 47 archivos en main (commit e4db88c). Push por conector: 403 en git/trees; 8 archivos por Contents API (1 tarjeta por archivo, ineficiente, parado); 39 restantes por subida web en Chrome de Augusto. Deploy key «Tico VM» con escritura + push por SSH desde la terminal de Tico probado. Verificado por clon y diff contra local |
| T-02 Top acumulado | (hecha antes del manual) | — | — | — | 🛠️ En curso | 2026-11-26 | | 0 | 0 | Código local hecho (TopAcumulado.tsx, RPC get_top_spenders, migración 20261126000000_top_spenders.sql); pendiente de PR |
| T-04 CI verify + protección de main | — | main | — | PR #1 (cerrado sin fusionar) | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 0 | 0 | Regla creada (PR + 1 aprobación + check verify) pero GitHub la marca «Not enforced»: en repo privado Free NO se aplica. Prueba: PR #1 rompía el build, verify falló y GitHub decía «merging is still available». Opciones para Augusto: pagar Team, hacer público el repo, o aceptar la regla sin efecto y apoyarse en CI + revisión manual |
| T-08 Limpiar historial y datos de ejemplo | T-08 limpiar historial | limpio (huérfana) | — | — | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 0 | 0 | Datos reales fuera del repo y del historial: copia en ~/workspace/cdg-real-seed/. Repo viejo borrado y recreado público y vacío por Augusto; main nuevo = commit 83232e8 (34 gastos de ejemplo, 1.402,70 AED; 47 archivos). Deploy key vieja retenida por GitHub («Key is already in use»); llave nueva «Tico VM» cdg2 con escritura. Protección de main recreada en el repo público (PR + 1 aprobación; check verify pendiente de nombrar cuando aparezca en el selector). CI #1 en verde en main (18 s, run 45931473147) |
| T-05 Crear proyecto Supabase y aplicar migraciones | — | — | — | — | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 0 | 0 | [DELICADA] Cuenta risturiz73@gmail.com confirmada con el 2º enlace; proyecto «control-de-gastos» creado (Free, Mumbai ap-south-1, Healthy, ref iszhvpgkuhililsxbuwb); migraciones 01, 02 y 03 aplicadas en vivo sin errores (primera prueba real de la BD); semilla real cargada y verificada (45 gastos = 2.022,86 AED, 4 recargas = 2.000 AED, NOV -22,86 AED); usuario de Auth creado (risturiz73@gmail.com, confirmado, rol admin); `.env` local con URL + anon key (nunca se commitea) |
| T-06 Auth UI + roles | — | limpio | — | #1 | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 3 | 7+1 | [DELICADA] Login, sesiones, guard de rutas, selector de usuario según rol. Commit 9597a05: Revisor 1ª revisión CAMBIOS NECESARIOS (7 hallazgos, 2 graves: escalada de rol y mezcla de gastos); correcciones en 9fc4f90; 2ª revisión CAMBIOS NECESARIOS (docs prometían asignar roles desde la app); corrección de docs en a226997; 3ª revisión APTO. PR #1, CI verify en verde (14 s), merge squash 6237773. Regla de main ajustada por Augusto: sin aprobación (repo de un solo usuario, el autor no puede aprobarse a sí mismo), PR + check verify obligatorio |
| T-09 Deploy a GitHub Pages contra Supabase | T-09 deploy Pages | t-09-deploy-pages-supabase | — | #3 | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 0 | 0 | Workflow deploy-pages.yml activado (antes apagado): build con VITE_DATA_SOURCE=supabase y secrets VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY; PR #3, CI en verde (16 s), merge squash 961085f. Pages activado (fuente GitHub Actions); primer deploy manual OK (build 16 s, deploy 10 s); sitio en vivo verificado (pantalla de login en español, sin errores) |

Estados: ⏳ Pendiente · 🛠️ En curso · 🔍 En revisión · 🔁 Cambios pedidos · ✅ Fusionada · ⛔ Bloqueada

## Pendiente del humano
- [ ] Probar el dashboard en https://augustoalr.github.io/control-de-gastos-dashboard/ como usuario (PASÓ / FALLÓ / NO PUDE PROBAR): entrar con risturiz73@gmail.com, ver sus gastos reales jul–nov, cambiar de mes, añadir un gasto de prueba y borrarlo
- [ ] Recordar: el proyecto Supabase Free se pausa a los 7 días sin actividad — entrar a la app o al panel al menos una vez por semana

## Problemas abiertos conocidos
- CI `verify` en verde en main (ejecución #1, commit 83232e8, 18 s).
- Protección de main en el repo público: regla creada y activa (PR + 1 aprobación, sin aviso «Not enforced»); el check `verify` no se pudo nombrar en la regla porque el selector no lo listaba — revisarlo al crear el primer PR de T-06.
- SSH: llave activa `id_ed25519_cdg2` (huella SHA256:aSUcsR0R0pCfxnnPwQaW0v7PCWgOZXgn3OVhec8X64w); la primera llave quedó retenida por GitHub tras borrar el repo viejo y no se puede reutilizar como deploy key. `/root/.ssh/` no persiste entre reemplazos de la VM: copiar llave + config desde `/home/hatch/.ssh/` si el push falla con «Connection reset».

## Documentos pendientes
- docs/DEPLOY.md → creado en T-01 (antes del primer deploy, como pide el manual)
- CHANGELOG.md → primera versión publicada (no todavía)

## Métricas (actualizar al cerrar cada tarea)
- Lead time medio: — · Bugs en producción este mes: 0 · CAMBIOS NECESARIOS del Revisor: 0
- CI verde al primer intento: — / — · Lecciones anotadas: 0
