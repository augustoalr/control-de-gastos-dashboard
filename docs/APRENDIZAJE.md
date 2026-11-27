# APRENDIZAJE — lo que aprendo con este proyecto

Modo profesor: SÍ · Lo actualiza el Manager al fusionar cada tarea (R-19).

## Lecciones (una línea por tarea)

| Fecha | Tarea | PR | Lección (1 línea, palabras simples) | Concepto nuevo | Tipo de error (si hubo) | ¿Repetido? |
|---|---|---|---|---|---|---|
| 2026-11-26 | T-01 | — | Las reglas del manual viven en AGENTS.md, no en la memoria del chat; el CI es el semáforo que comprueba cada cambio. | CI (revisión automática) | — | — |
| 2026-11-26 | T-07 | — | Un viewer ve totales, no el detalle: los permisos se comprueban tabla por tabla, y la semilla se verifica contando, no a ojo. | RLS (permisos por fila) | Permisos supuestos | — |
| 2026-11-27 | T-06 | #1 | Un rol que el propio usuario puede cambiar no es un permiso, es una sugerencia: el candado tiene que estar en la base de datos, no en la pantalla. Y en un repo de un solo usuario, pedir aprobación bloquea todo, porque GitHub no deja aprobar el propio PR. | Trigger + policy (candado en la BD) | Permiso supuesto + regla que bloquea | — |

## Errores que se repiten (candidatos a regla)
- (vacío por ahora; si un tipo de error aparece por 2.ª vez, el Manager propone una regla R-20… con su "Por qué")

## Mi nivel (lo marco yo una vez por semana)
| Tema | Lo puedo explicar | Lo puedo cambiar con ayuda | Lo hago solo |
|---|---|---|---|
| ramas y PRs | [ ] | [ ] | [ ] |
| CI (comprobación automática) | [ ] | [ ] | [ ] |
| Supabase y RLS (permisos por fila) | [ ] | [ ] | [ ] |
| dinero en céntimos | [ ] | [ ] | [ ] |
