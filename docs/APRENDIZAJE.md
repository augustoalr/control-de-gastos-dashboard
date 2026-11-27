# APRENDIZAJE — lo que aprendo con este proyecto

Modo profesor: SÍ · Lo actualiza el Manager al fusionar cada tarea (R-19).

## Lecciones (una línea por tarea)

| Fecha | Tarea | PR | Lección (1 línea, palabras simples) | Concepto nuevo | Tipo de error (si hubo) | ¿Repetido? |
|---|---|---|---|---|---|---|
| 2026-11-26 | T-01 | — | Las reglas del manual viven en AGENTS.md, no en la memoria del chat; el CI es el semáforo que comprueba cada cambio. | CI (revisión automática) | — | — |
| 2026-11-26 | T-07 | — | Un viewer ve totales, no el detalle: los permisos se comprueban tabla por tabla, y la semilla se verifica contando, no a ojo. | RLS (permisos por fila) | Permisos supuestos | — |
| 2026-11-27 | T-06 | #1 | Un rol que el propio usuario puede cambiar no es un permiso, es una sugerencia: el candado tiene que estar en la base de datos, no en la pantalla. Y en un repo de un solo usuario, pedir aprobación bloquea todo, porque GitHub no deja aprobar el propio PR. | Trigger + policy (candado en la BD) | Permiso supuesto + regla que bloquea | — |
| 2026-11-27 | T-05 | — | La base de datos se prueba de verdad solo cuando las migraciones corren en el proyecto real: en local todo pasaba, y en vivo también pasó a la primera. Y los totales se verifican contando en la BD, no a ojo. | SQL Editor + verificación por conteo | — | — |
| 2026-11-27 | T-09 | #3 | Publicar es dos cosas separadas: el código que se fusiona y el deploy que se lanza a mano; la clave pública va en secretos de GitHub, nunca escrita en un archivo. | GitHub Pages + secrets | — | — |
| 2026-11-27 | T-10 | #5 | Dos policies que se consultan entre sí con EXISTS son un círculo: Postgres lo corta con recursión infinita y la app no carga nada. La salida es preguntar a una función que lee por dentro, saltando RLS. | Función security definer | EXISTS entre policies | — |
| 2026-11-27 | T-11 | #6 | RLS sin GRANT es una puerta cerrada con llave dentro: las rules decían quién ve qué, pero nadie podía ni leer la tabla. Y un error puede tapar a otro: la recursión se detecta al reescribir la consulta, antes de comprobar permisos, así que el permiso que faltaba solo salió al quitar la recursión. | GRANTs + policies | Probar solo en local | Verificación RLS simulando al usuario autenticado |

## Errores que se repiten (candidatos a regla)
- (vacío por ahora; si un tipo de error aparece por 2.ª vez, el Manager propone una regla R-20… con su "Por qué")

## Mi nivel (lo marco yo una vez por semana)
| Tema | Lo puedo explicar | Lo puedo cambiar con ayuda | Lo hago solo |
|---|---|---|---|
| ramas y PRs | [ ] | [ ] | [ ] |
| CI (comprobación automática) | [ ] | [ ] | [ ] |
| Supabase y RLS (permisos por fila) | [ ] | [ ] | [ ] |
| dinero en céntimos | [ ] | [ ] | [ ] |
