# Cómo organizamos el trabajo en Space

Kanban ligero con milestones. Sin sprints ni fechas fijas: lo que importa es que todo tenga dueño, estado y un siguiente paso.

## Flujo de un ticket
`Intake` → `Backlog` → `Listo` → `En progreso` → `En revisión (QA)` → `Hecho`

- **Intake:** todo lo nuevo entra como issue «Solicitud» o «Bug». Una persona hace triage una vez por semana: pone tipo, área y prioridad, o lo cierra con motivo.
- **Listo:** tiene objetivo y criterios de aceptación claros, y cabe en menos de 2 días. Si es más grande, se parte.
- **En revisión (QA):** pasó `tsc` y la matriz de pruebas sin fallas nuevas.
- **Bloqueado** y **necesita info** son etiquetas, no columnas: el ticket se queda donde estaba.

## Etiquetas
- **Tipo:** bug, mejora, funcionalidad, solicitud, deuda técnica.
- **Severidad (solo bugs):** S1 crítica, S2 alta, S3 media, S4 baja (la misma escala de la matriz de QA).
- **Área:** catálogo, panel, importar/exportar, cuenta y acceso, landing, SEO y rendimiento, accesibilidad.
- **Prioridad** (campo del proyecto): P0 ahora, P1 siguiente, P2 pronto, P3 algún día. Un bug S1 es P0 por definición.

## Milestones
Agrupan tickets por objetivo, no por fecha. Se cierran cuando todos sus tickets están hechos y desplegados.

## Ramas y despliegue
- Se trabaja en ramas `feat/…`, `fix/…` o `chore/…` que salen de `dev`.
- Cada PR enlaza su ticket con `Closes #n`.
- `dev` es la rama de integración. `main` es producción: solo se actualiza con confirmación explícita, después de la matriz de QA y de revisar el despliegue de `dev`.
- Cada release guarda el commit anterior como punto de retorno.

## Bugs
El título dice qué falla y dónde. Lleva pasos, esperado vs. obtenido y evidencia. Si lo encontró el QA, se agrega el ID de la matriz y la etiqueta «encontrado en QA».
