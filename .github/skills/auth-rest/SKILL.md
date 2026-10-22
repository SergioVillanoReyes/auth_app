---
name: auth-rest
description: Guía para implementar o revisar autenticación REST en este proyecto React Native, incluidos login, verificación de sesión, renovación y persistencia de tokens, y logout.
---

# Skill: autenticación REST

## 1. Propósito

Guiar tareas de implementación o revisión de autenticación REST en este proyecto, manteniendo el comportamiento acordado, la protección de credenciales y tokens, y las fronteras existentes entre capas. Esta skill complementa —no reemplaza— las instrucciones generales del repositorio y los requisitos de cada funcionalidad.

## 2. Cuándo usarla y cuándo no

Usar esta skill cuando una tarea solicite crear, modificar, depurar o revisar:

- login/logout contra una API REST;
- verificación, restauración o renovación de sesiones y tokens;
- transporte HTTP, mapeo de respuestas/errores o persistencia de una sesión;
- pruebas directamente relacionadas con esos flujos.

No usarla para implementar registro, recuperación de contraseña, OAuth, autorización/roles, cambios generales de interfaz o funciones ajenas a autenticación, salvo que la solicitud y los documentos de requisitos los incluyan expresamente. No ampliar el alcance porque una API o ejemplo ofrezca capacidades adicionales.

La ubicación en `.github/skills/auth-rest/SKILL.md` corresponde a una skill de proyecto admitida por la documentación actual de GitHub Copilot. Que esté disponible o se cargue automáticamente depende de la superficie y versión de Copilot; no afirmar que se invocó o cargó automáticamente sin comprobarlo. Si la tarea requiere esta guía y no está en contexto, leer este archivo.

## 3. Inspección previa a implementar

1. Inspeccionar `git status` y el diff existente. Preservar cambios locales y detenerse si hay conflicto con el alcance solicitado.
2. Leer `AGENTS.md` y las instrucciones de `.github/` aplicables. Identificar el stack, arquitectura, restricciones nativas, convenciones de pruebas y verificación.
3. Localizar y leer los documentos de requisitos de la funcionalidad, si existen. Para el login actual, revisar `docs/features/login/intent.md`, `spec.md` y `REVIEW.md`; identificar criterios, exclusiones, decisiones pendientes y escenarios de aceptación antes de tocar código.
4. Inspeccionar la implementación y pruebas actuales: contratos de dominio, datasource HTTP, repositorios/casos de uso, almacenamiento, composición, contexto/pantallas y adaptadores nativos relevantes. Buscar reutilización y evitar duplicar contratos.
5. Confirmar los endpoints, payloads, headers, campos de respuesta y errores en la documentación del servicio indicada por el proyecto. No inventar semánticas de expiración, revocación, rotación o códigos de error.
6. Si documentos y código discrepan, no asumir cuál describe el comportamiento deseado: validar el estado real, informar la diferencia y solicitar aclaración cuando afecte al alcance o a una decisión funcional.
7. Definir qué pruebas y verificaciones son pertinentes antes de implementar. Mantener los cambios acotados y no modificar código, pruebas, configuración o dependencias que no sean necesarios para el pedido.

Para el login DummyJSON existente, `intent.md` define el problema y el alcance; `spec.md` contiene los comportamientos y criterios de aceptación; `REVIEW.md` guía la evaluación del diff, severidad y reporte. Consultarlos como fuentes canónicas en vez de copiar sus reglas completas en cada cambio.

## 4. HTTP, errores y respuestas

- Usar únicamente endpoints y métodos confirmados por los requisitos/documentación. En el flujo DummyJSON documentado: `POST /auth/login`, `GET /auth/me` con bearer access token y `POST /auth/refresh` con refresh token.
- Enviar credenciales y tokens solo en los campos/headers requeridos. No reenviar credenciales en verificación o renovación si el contrato no lo exige.
- Comprobar el estado HTTP antes de tratar una respuesta como éxito. Distinguir un rechazo de autenticación de errores de red, indisponibilidad/errores del servicio y errores de otras categorías de acuerdo con el contrato observable del proveedor.
- Un 401/403 no debe confundirse con un timeout o fallo de conectividad. No borrar una sesión recuperable ante un fallo transitorio. Renovar solo ante la condición de autenticación especificada; los errores no relacionados con autenticación no inician refresh.
- Validar la forma y los tipos de toda respuesta externa antes de convertirla a tipos del dominio. Un cuerpo ausente, JSON inválido, campos requeridos ausentes o tokens vacíos es una respuesta inválida, no una respuesta autenticada ni un error de red.
- No aceptar una respuesta de login/refresh sin la pareja completa de tokens requerida. Persistir la pareja nueva antes de continuar; verificar el nuevo access token antes de declarar restaurada la sesión cuando así lo exija `spec.md`.
- Propagar errores relevantes con categorías que permitan presentar feedback correcto y reintentar. No usar catches que conviertan fallos en `null`, éxito aparente o rechazo de credenciales. No exponer detalles internos o cuerpos sensibles en mensajes al usuario.
- Evitar ciclos de renovación/reintento. Aplicar los límites especificados por solicitud y coordinar llamadas concurrentes para una misma sesión según los requisitos del proyecto.
- Ante ambigüedad en la clasificación del proveedor, aplicar el manejo conservador descrito por la especificación; si no se puede preservar una sesión válida o decidir la transición de forma segura, detenerse y preguntar.

## 5. Credenciales, tokens y sesión

- No imprimir, registrar, incluir en errores, snapshots o mensajes visibles el usuario/contraseña, access token, refresh token, headers de autorización ni cuerpos que los contengan.
- No guardar credenciales. Persistir solo los datos de sesión permitidos por los requisitos y usar el `StorageModule` existente cuando esa sea la arquitectura acordada.
- Mantener los tokens juntos si el contrato del proyecto así lo requiere; validar datos leídos y distinguir clave ausente, dato malformado y fallo de almacenamiento.
- Los fallos de lectura, escritura o borrado deben propagarse. No declarar login/refresh/logout completado si la persistencia necesaria falló.
- En logout, limpiar la sesión local antes de confirmar el estado anónimo. No afirmar revocación remota a menos que el proveedor documente y los requisitos pidan esa operación.
- Respetar las protecciones nativas existentes y reconocer diferencias entre plataformas. No modificar firma, identificadores, permisos, certificados, RASP/Talsec, privacidad ni configuración nativa no necesaria sin autorización expresa.
- No asumir que iOS `UserDefaults` ofrece la misma protección que el almacenamiento cifrado de Android. No crear un segundo módulo de almacenamiento para eludir la arquitectura.

## 6. Pruebas unitarias a considerar

Seleccionar casos según el cambio y los criterios de aceptación; usar mocks tipados y deterministas para red y almacenamiento, sin llamadas reales al proveedor en pruebas unitarias.

- **Datasource/HTTP:** endpoint, método, payload, headers; respuesta correcta; estados HTTP no exitosos; fallo de red; cuerpo vacío/JSON inválido; respuesta incompleta y tipos incorrectos.
- **Login/presentación:** campos vacíos o solo espacios no llaman al servicio; credenciales válidas guardan tokens antes de autenticar; rechazo, error transitorio y respuesta inválida dan feedback diferenciado; estado de carga evita doble envío y se conservan campos para corregir/reintentar.
- **Almacenamiento:** sesión ausente; pareja válida; JSON malformado, campos incompletos o tokens vacíos; errores de lectura/escritura/borrado propagados; persistencia de la pareja bajo la clave definida.
- **Restauración/renovación:** token válido; access token rechazado; refresh válido/inválido/incompleto; persistencia y verificación de tokens nuevos; fallos transitorios que preservan sesión para reintento; error de storage; limpieza exitosa y fallida.
- **Concurrencia/logout:** single-flight cuando se requiera, límites de reintento, respuestas concurrentes contradictorias y operaciones tardías de login/refresh frente a logout. Comprobar que no se restaura ni presenta una sesión inválida.
- **Integración de estado:** no mostrar Home antes de verificar/persistir; error de inicialización mantiene opción de reintento; logout fallido no se presenta como completado.

Comprobar tanto resultados como llamadas relevantes. Una prueba que solo renderiza la app sin aserciones funcionales no demuestra los criterios del flujo. No debilitar, borrar ni cambiar aserciones para ocultar fallos; si falta cobertura, informarlo o añadir pruebas solo cuando el pedido lo autorice.

## 7. Comandos de verificación

Confirmar siempre la configuración actual en `package.json`, `tsconfig.json`, `jest.config.js` y/o la configuración aplicable antes de ejecutar comandos. Los comandos conocidos del proyecto son:

- Pruebas: `npm test`
- Lint: `npm run lint`
- TypeScript: `npx tsc --noEmit` (no asumir que existe un script `typecheck`; comprobar `package.json`)

Ejecutar los comandos seguros y pertinentes para el cambio. Registrar exactamente cuáles se ejecutaron, resultados/código de salida y limitaciones. No afirmar resultados no observados, no inventar scripts ni exclusiones y no convertir un fallo preexistente o de artefacto generado en una verificación exitosa. No modificar archivos ajenos al alcance para forzar que pase el comando. Seguir `REVIEW.md` para documentar fallos y distinguir los introducidos por el cambio de los preexistentes.

## 8. Cuándo detenerse y pedir aclaración

Detener la implementación y preguntar antes de asumir cuando:

- `intent.md`, `spec.md`, instrucciones de revisión, petición o comportamiento real se contradigan en una regla relevante;
- no esté definido el tratamiento de una respuesta/código de error y elegirlo pueda borrar una sesión válida o autenticar una sesión inválida;
- no se conozcan los endpoints, campos obligatorios, mecanismo de expiración, rotación o condiciones de refresh del proveedor;
- se requiera decidir persistencia, duración de sesión, protección nativa, revocación, logout remoto o tratamiento de tokens sin un requisito explícito;
- la solución parezca necesitar nuevas dependencias, contratos compartidos o cambios de configuración/plataforma fuera del alcance;
- un cambio pueda afectar el ejemplo funcional existente, pruebas/assertions, RASP/Talsec, certificados, permisos, firma o datos sensibles;
- el estado del repositorio tenga cambios previos que entren en conflicto con el trabajo solicitado.

Al pedir aclaración, describir la decisión pendiente, las alternativas relevantes y el riesgo de asumir. No presentar una elección especulativa como requisito confirmado ni ampliar el alcance mientras se espera respuesta.
