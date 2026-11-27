# ESTADO del proyecto

Última actualización: 2026-11-26 16:27 +04 (Asia/Dubái) por Manager (T-03, snapshot en main)
Nivel de riesgo del proyecto: 3 · Modo profesor: SÍ · Lecciones: docs/APRENDIZAJE.md
Repo: https://github.com/augustoalr/control-de-gastos-dashboard (público desde T-08, rama main; historial limpio en un solo commit, datos de ejemplo)

## Ahora mismo
- En curso: T-05 — Crear proyecto Supabase y aplicar migraciones
- Bloqueado por el humano: activar SSH en Muse (Ajustes → Permisos → Protocolos de red directos → ssh a Preguntar) para volver a empujar desde la terminal; confirmar el correo de Supabase cuando se cree la cuenta
- Próxima tarea propuesta: T-05 — Crear proyecto Supabase y aplicar migraciones

## Tabla de tareas

| Tarea | Conversación | Rama | Worktree | PR | Estado | Inicio | Merge | Rondas | Errores atrapados | Nota |
|---|---|---|---|---|---|---|---|---|---|---|
| T-01 Montaje manual | T-01 montaje manual | — (sin repo con commits todavía) | — (en serie) | — | 🔍 En revisión | 2026-11-26 | | 0 | 0 | Documentos + CI verificados por el Manager (build en verde); el snapshot que incluye está en T-07 |
| T-07 Correcciones del Revisor | T-07 correcciones Revisor | — | — (en serie) | — | ✅ Fusionada | 2026-11-26 | 2026-11-26 | 0 | 11 | Revisor 2ª revisión: APTO (11/11 corregidas, build en copia limpia en verde) |
| T-03 Subir snapshot inicial a main | — | main | — | — | ✅ Fusionada | 2026-11-26 | 2026-11-26 | 0 | 0 | 47 archivos en main (commit e4db88c). Push por conector: 403 en git/trees; 8 archivos por Contents API (1 tarjeta por archivo, ineficiente, parado); 39 restantes por subida web en Chrome de Augusto. Deploy key «Tico VM» con escritura + push por SSH desde la terminal de Tico probado. Verificado por clon y diff contra local |
| T-02 Top acumulado | (hecha antes del manual) | — | — | — | 🛠️ En curso | 2026-11-26 | | 0 | 0 | Código local hecho (TopAcumulado.tsx, RPC get_top_spenders, migración 20261126000000_top_spenders.sql); pendiente de PR |
| T-04 CI verify + protección de main | — | main | — | PR #1 (cerrado sin fusionar) | ✅ Fusionada | 2026-11-27 | 2026-11-27 | 0 | 0 | Regla creada (PR + 1 aprobación + check verify) pero GitHub la marca «Not enforced»: en repo privado Free NO se aplica. Prueba: PR #1 rompía el build, verify falló y GitHub decía «merging is still available». Opciones para Augusto: pagar Team, hacer público el repo, o aceptar la regla sin efecto y apoyarse en CI + revisión manual |
| T-08 Limpiar historial y datos de ejemplo | T-08 limpiar historial | limpio (huérfana) | — | — | 🔍 En revisión | 2026-11-27 | | 0 | 0 | Datos reales fuera del repo y del historial: copia en ~/workspace/cdg-real-seed/; 34 gastos de ejemplo (1.402,70 AED) en seed.json y seed.sql; rama `limpio` con 1 solo commit, sin push todavía. El Manager decide el force-push a main y hacer público el repo |
| T-05 Crear proyecto Supabase y aplicar migraciones | — | — | — | — | ⏳ Pendiente | | | | | [DELICADA] Cuenta nueva con risturiz73@gmail.com pendiente de crear el proyecto; contraseña ya guardada en Vault |
| T-06 Auth UI + roles | — | — | — | — | ⏳ Pendiente | | | | | [DELICADA] Login, sesiones, guard de rutas, selector de usuario según rol |

Estados: ⏳ Pendiente · 🛠️ En curso · 🔍 En revisión · 🔁 Cambios pedidos · ✅ Fusionada · ⛔ Bloqueada

## Pendiente del humano
- [ ] Probar el dashboard como usuario cuando haya preview o deploy (PASÓ / FALLÓ / NO PUDE PROBAR)
- [ ] Confirmar el correo de Supabase (risturiz73@gmail.com) cuando se cree la cuenta/el proyecto (T-05)

## Problemas abiertos conocidos
- CI `verify` en verde en main (última ejecución #11, commit 0782400).
- En repo público Free, GitHub Pages sí se activa y la protección de ramas sí se aplica (antes, en privado, no: verificado en T-04 con PR #1).
- SSH saliente apagado en Muse desde el 2026-11-27: el push por terminal falla hasta que Augusto lo active (Ajustes → Permisos → Protocolos de red directos → ssh a Preguntar). Mientras tanto, los cambios suben por conector o navegador.

## Documentos pendientes
- docs/DEPLOY.md → creado en T-01 (antes del primer deploy, como pide el manual)
- CHANGELOG.md → primera versión publicada (no todavía)

## Métricas (actualizar al cerrar cada tarea)
- Lead time medio: — · Bugs en producción este mes: 0 · CAMBIOS NECESARIOS del Revisor: 0
- CI verde al primer intento: — / — · Lecciones anotadas: 0
