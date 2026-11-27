# TAREAS (backlog)

Reglas: tareas pequeñas (1–2 días como máximo). Marca [DELICADA] si toca BD, auth, seguridad, dinero, migraciones o permisos.

## T-01 — Montaje manual (documentos + CI)
- Historia de usuario: Como Augusto quiero que el proyecto siga mi manual desde el primer día, para no perder el orden ni la seguridad.
- Objetivo: dejar AGENTS.md, PRD, MANAGER, ESTADO, TAREAS, APRENDIZAJE, DEPLOY y el CI "verify" creados en local, sin tocar src/ ni supabase/.
- Criterios de aceptación:
  - [ ] AGENTS.md con R-01…R-19 copiadas tal cual, "Modo profesor: SÍ", nivel de riesgo 3 y contexto real del proyecto.
  - [ ] docs/PRD.md, docs/MANAGER.md, docs/ESTADO.md, docs/APRENDIZAJE.md, docs/DEPLOY.md creados.
  - [ ] `.github/workflows/ci.yml` con el check "verify" (checkout, setup-node 20, npm ci, npm run build), sin secretos ni deploy.
  - [ ] `npm run build` pasa en local.
- Depende de: ninguna
- Marca: vacío
- Estado: 🛠️ En curso

## T-02 — Top acumulado (Mes / Total)
- Historia de usuario: Como manager quiero ver a un lado el Top acumulado de gastos por persona, en el mes o en total, para saber quién gasta más.
- Objetivo: Top en el panel derecho con cambio de vista Mes/Total, totales calculados en la BD y solo para quien tengo permiso de ver.
- Criterios de aceptación:
  - [ ] Componente TopAcumulado con botones Mes / Total y filas con puesto, nombre, total AED, % y nº de gastos.
  - [ ] RPC `get_top_spenders(p_month_id, p_limit)` con `p_month_id = null` para el total, filtrada por rol/subordinados.
  - [ ] Con los datos de ejemplo solo sale el usuario demo: NOV 291,35 AED (9 gastos), total 1.402,70 AED (34 gastos).
  - [ ] `npm run build` pasa.
- Depende de: ninguna (código local ya hecho)
- Marca: [DELICADA] (RLS, roles, dinero)
- Estado: 🛠️ En curso (código local hecho, pendiente de PR)

## T-03 — Subir snapshot inicial a main
- Historia de usuario: Como Augusto quiero que el código esté en mi repo de GitHub, para no perderlo y poder desplegarlo.
- Objetivo: subir todo el código local (MVP + Top + documentos de T-01) al repo vacío, en main, en un solo snapshot inicial.
- Criterios de aceptación:
  - [ ] El repo https://github.com/augustoalr/control-de-gastos-dashboard tiene el código en main y el README visible.
  - [ ] No se suben secretos, `.env`, `node_modules` ni `dist`.
  - [ ] El CI "verify" corre en ese push.
- Depende de: T-01
- Marca: vacío
- Estado: ⏳ Pendiente

## T-04 — CI verify + protección de main
- Historia de usuario: Como Augusto quiero que nadie pueda meter código roto en main sin revisión, para que la app no se rompa.
- Objetivo: CI "verify" obligatorio en main y main protegida (PR obligatorio + check "verify" obligatorio).
- Criterios de aceptación:
  - [ ] El check "verify" está en verde en el último commit de main.
  - [ ] Main protegida: no se puede hacer push directo; un PR de prueba con un fallo a propósito no se deja fusionar.
  - [ ] Riesgo anotado: en repo privado Free la protección de ramas puede no estar disponible — si no está disponible, el Manager lo dice con opciones A/B y su recomendación, no lo inventa como hecho.
- Depende de: T-03
- Marca: [DELICADA] (configuración de producción)
- Estado: ⏳ Pendiente

## T-05 — Crear proyecto Supabase y aplicar migraciones
- Historia de usuario: Como Augusto quiero que mis gastos vivan en una base de datos real, para verlos desde cualquier sitio y con permisos por usuario.
- Objetivo: crear el proyecto Supabase en la cuenta nueva (risturiz73@gmail.com), aplicar las dos migraciones y cargar la semilla con el uuid real de Auth.
- Criterios de aceptación:
  - [ ] Proyecto creado en la cuenta de risturiz73@gmail.com (contraseña ya guardada en Vault).
  - [ ] Migraciones `20261124000000_init.sql` y `20261126000000_top_spenders.sql` aplicadas sin errores.
  - [ ] Semilla cargada: 34 gastos de ejemplo, totales JUL–NOV iguales que en `public/data/seed.json`.
  - [ ] La app en local con `VITE_DATA_SOURCE=supabase` muestra los mismos totales que con `local`.
- Depende de: T-03
- Marca: [DELICADA] (BD, migraciones, RLS)
- Estado: ⏳ Pendiente

## T-06 — Auth UI + roles
- Historia de usuario: Como Augusto quiero entrar con mi cuenta y ver solo mis gastos (y los de mis subordinados si soy manager), para que nadie vea lo de otro.
- Objetivo: pantalla de login, sesiones, guard de rutas y selector de usuario según rol, con `profiles.role` y `manager_members` ya creados.
- Criterios de aceptación:
  - [ ] Login y logout funcionan; sin sesión no se ve el dashboard.
  - [ ] Un member solo ve lo suyo; un manager ve a sus subordinados; un viewer solo ve totales; un admin ve todo.
  - [ ] Augusto prueba con dos cuentas de prueba: una no ve los datos de la otra (PASÓ / FALLÓ).
  - [ ] `npm run build` pasa y CI en verde.
- Depende de: T-05
- Marca: [DELICADA] (auth, RLS, permisos)
- Estado: ⏳ Pendiente
