# Cómo organizamos el trabajo en Space

Kanban ligero con milestones. Sin sprints ni fechas fijas: lo que importa es que todo tenga dueño, estado y un siguiente paso.

## Dónde vive todo
- **Tickets:** issues de este repositorio. Es público: nada de datos de clientes, correos, teléfonos ni llaves en tickets, capturas o comentarios.
- **Tablero:** el proyecto «Space» de la organización, con una vista por tipo de trabajo (Bugs, Funcionalidades, Ideas) y las de apoyo que se vayan necesitando. Cada vista filtra por etiqueta de tipo, así que un ticket cae en su vista solo con tener la etiqueta correcta.
- **Plantillas:** al crear un issue se elige Bug, Funcionalidad nueva, Mejora o Solicitud (intake). Cada una pone su etiqueta de tipo.

## Flujo de un ticket
`Intake` → `Listo` → `En progreso` → `En revisión (QA)` → `Hecho`

- **Intake:** todo lo nuevo entra como «Solicitud» o «Bug». Una persona hace triage una vez por semana: confirma tipo, área y severidad, o lo cierra con motivo.
- **Listo:** tiene objetivo y criterios de aceptación claros, y cabe en menos de 2 días. Si es más grande, se parte.
- **En revisión (QA):** pasó `tsc` y la matriz de pruebas sin fallas nuevas.
- **Bloqueado** y **necesita info** son etiquetas, no estados: el ticket se queda donde estaba.

Los estados son los valores del campo Status del proyecto. Si el proyecto no los tiene todavía, se agregan ahí.

## Etiquetas
- **Tipo:** bug, mejora, funcionalidad, solicitud, deuda técnica.
- **Severidad (solo bugs):** S1 crítica, S2 alta, S3 media, S4 baja (la misma escala de la matriz de QA). Quien reporta la sugiere en el formulario; en el triage se confirma y se pone la etiqueta.
- **Área:** catálogo, panel, importar/exportar, cuenta y acceso, landing, SEO y rendimiento, accesibilidad.

## Milestones
Agrupan tickets por objetivo, no por fecha. Se cierran cuando todos sus tickets están hechos y desplegados.

## Ramas y despliegue
- Se trabaja en ramas `feat/…`, `fix/…` o `chore/…` que salen de `dev`.
- Cada PR enlaza su ticket con `Closes #n`.
- `dev` es la rama de integración. `main` es producción: solo se actualiza con confirmación explícita, después de la matriz de QA y de revisar el despliegue de `dev`.
- Cada release guarda el commit anterior como punto de retorno.

## Bugs
El título dice qué falla y dónde. Lleva pasos, esperado vs. obtenido y evidencia. Si lo encontró el QA, se agrega el ID de la matriz y la etiqueta «encontrado en QA». Los bugs reportados con la extensión Bug Box llegan ya como issue con la etiqueta `tipo: bug`.
