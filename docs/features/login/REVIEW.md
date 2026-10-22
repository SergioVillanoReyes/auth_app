# Criterios de revisión de código: login con DummyJSON

## Propósito

Esta guía define cómo revisar cambios del flujo de autenticación de este proyecto. Su objetivo es encontrar regresiones y riesgos con evidencia verificable, no imponer cambios de diseño ni ampliar el alcance acordado.

La revisión debe contrastar el comportamiento con [`intent.md`](./intent.md) y [`spec.md`](./spec.md). Si hay una discrepancia, señalarla explícitamente y no sustituir la especificación por una suposición del revisor. Mantener intacto el ejemplo funcional del login; esta guía no autoriza cambios de código, pruebas, dependencias ni configuración.

## Principios de revisión

1. Revisar el diff completo, incluidos archivos nuevos, eliminados, renombrados y cambios nativos. Distinguir cambios necesarios de los ajenos al objetivo.
2. Confirmar cada hallazgo en el código y en el comportamiento o prueba pertinente. No reportar especulaciones como vulnerabilidades confirmadas.
3. Priorizar el impacto en el usuario, la confidencialidad de credenciales y tokens, y la posibilidad de acceso o transición de sesión incorrectos.
4. Verificar errores y estados límite además del caso feliz. Un error de red o de almacenamiento no equivale a una sesión inválida ni a una operación exitosa.
5. No considerar una prueba como evidencia suficiente solo porque existe: comprobar que ejercita el comportamiento, comprueba el resultado y falla si se rompe el requisito.
6. No cambiar código, pruebas o aserciones durante una revisión para ocultar fallos. Las correcciones solo se realizan con autorización y como tarea separada.
7. Separar los defectos introducidos por el cambio de los problemas preexistentes. No atribuir al cambio fallos que ya existían.

## Lista de criterios

### 1. Corrección funcional y cumplimiento de intención/especificación

- Login valida usuario y contraseña vacíos o compuestos solo por espacios antes de llamar al servicio. No transforma silenciosamente las credenciales.
- Mientras se procesa el login, la interfaz comunica el estado y evita envíos duplicados.
- Una respuesta válida guarda access token y refresh token antes de mostrar Home. Una respuesta incompleta o un fallo de persistencia nunca autentican al usuario.
- El rechazo de credenciales ofrece un mensaje comprensible y conserva el formulario para corregirlo. Los fallos de conexión/servicio permiten reintentar y no se presentan como credenciales incorrectas.
- Al iniciar la app se muestra el estado de carga hasta decidir el destino: Login si no existe sesión, Home solo tras verificarla, o un estado con error y reintento cuando no se pueda completar la verificación.
- La restauración intenta renovar tras un rechazo de autenticación del access token. Después de una renovación, persiste ambos tokens y verifica el access token nuevo antes de mostrar Home.
- Los fallos transitorios de red/servicio no invalidan ni borran automáticamente una sesión recuperable. Un rechazo definitivo sí exige completar la limpieza antes de pasar a Login.
- Logout no confirma el estado anónimo mientras falle la limpieza del almacenamiento.
- Los errores distintos de autenticación no disparan renovación automáticamente. Cada solicitud protegida tiene límites de renovación/reintento según `spec.md`; las solicitudes concurrentes de una misma sesión no inician renovaciones redundantes.
- Las transiciones tardías de login o renovación no pueden restaurar tokens después de logout ni autenticar una sesión que fue reemplazada.
- El alcance sigue limitado al login, restauración, renovación y logout acordados; no se incorporan registro, recuperación de contraseña, OAuth, roles, rediseño o servicios no solicitados.

### 2. Seguridad del login y manejo de tokens

- Usuario, contraseña, access token y refresh token no aparecen en logs, mensajes de error, interfaz, snapshots, fixtures compartidos ni trazas de diagnóstico.
- Las credenciales se envían únicamente al endpoint de autenticación esperado; el access token se transmite como bearer cuando corresponde y el refresh token solo se usa para renovar.
- La aplicación no autentica respuestas que carezcan de una pareja de tokens válida, ni trata datos guardados malformados como sesión ausente sin la limpieza requerida.
- La pareja se guarda y recupera de forma conjunta según el contrato de `spec.md`. Los errores de lectura, escritura y borrado se propagan; nunca se convierten silenciosamente en `null` o éxito.
- Una renovación reemplaza ambos tokens solo tras recibir una pareja utilizable y guardarla correctamente. Una respuesta de autenticación rechazada luego del único reintento no inicia un ciclo ilimitado.
- El adaptador JavaScript usa el `NativeModules.StorageModule` existente. Los cambios de borrado coordinan la implementación nativa y el puente iOS; no crean otro módulo ni alteran mecanismos, registros, certificados o configuración ajena al alcance.
- Se reconoce la diferencia de protección existente entre Android (`EncryptedSharedPreferences`) e iOS (`UserDefaults`); no se afirma ni presupone equivalencia de seguridad.
- No se incluyen secretos reales en código, pruebas, documentación o comandos compartidos. Los errores visibles son útiles, pero no revelan credenciales, tokens ni detalles internos sensibles.

### 3. Calidad y cobertura de pruebas unitarias

- Las pruebas usan dobles deterministas y tipados para red y almacenamiento; no dependen de llamadas reales a DummyJSON para validar reglas unitarias.
- Se comprueban las salidas y las interacciones relevantes: endpoint, método, headers/body, persistencia, limpieza, estado de interfaz y límites de llamadas.
- La cobertura funcional considera, donde corresponda, validación de entrada, éxito, rechazo de credenciales, error de red/servicio, respuesta incompleta, ausencia de sesión, sesión válida, token rechazado, renovación exitosa/definitiva/transitoria, error de almacenamiento y logout.
- El almacenamiento cubre clave ausente, pareja válida, datos malformados/incompletos/vacíos y propagación de fallos de lectura, escritura y eliminación.
- La coordinación de sesión comprueba concurrencia/single-flight, reintento limitado y carreras entre renovación/login y logout cuando el cambio afecta esas rutas.
- Las pruebas de presentación comprueban que no se muestra Home antes de verificar/guardar la sesión, que los errores permiten la acción de reintento y que el logout fallido no se presenta como exitoso.
- Las aserciones deben expresar requisitos observables y detectar regresiones. No se eliminan, debilitan ni cambian para hacer pasar una implementación incorrecta.
- Informar por separado qué rutas importantes no tienen prueba. No afirmar un porcentaje de cobertura si no se generó y examinó un reporte de cobertura.

### 4. Cambios innecesarios o fuera de alcance

- Cada archivo modificado tiene una relación explicable con el cambio solicitado o con una prueba/documentación directamente asociada.
- No se incluyen cambios de formato masivos, refactors no necesarios, dependencias nuevas, lockfiles, artefactos generados, archivos de build o modificaciones ajenas al login.
- Los cambios nativos se limitan a la superficie requerida y conservan los registros, identificadores, protecciones y configuración existentes.
- Las pruebas existentes y el ejemplo funcional se preservan; no se alteran para ocultar fallos ni se eliminan verificaciones sin justificación funcional.
- Revisar `git status` y el diff antes de concluir. Declarar por separado cualquier archivo preexistente modificado que no pertenezca al cambio evaluado; no revertirlo automáticamente.

### 5. Calidad del código, tipos y manejo de errores

- Se mantienen las fronteras arquitectónicas del proyecto: `domain` no depende de `data`, React Native ni `presentation`; el acceso nativo y HTTP queda encapsulado en `data`; la composición corresponde a `src/core/di`.
- Los tipos reflejan los contratos reales. Evitar `any` explícito, conversiones inseguras, respuestas remotas asumidas válidas y estados imposibles que puedan expresarse mediante tipos más precisos.
- Las respuestas externas se validan antes de convertirse en entidades o tokens de dominio.
- Los errores se distinguen según lo necesario para decidir el flujo: rechazo de autenticación, fallo transitorio de red/servicio, respuesta inválida y fallo de almacenamiento.
- No hay catches amplios que silencien fallos, valores por defecto con forma de éxito, errores convertidos en sesión ausente, ni operaciones asíncronas importantes cuyo rechazo se pierda.
- Los mensajes al usuario son claros y seguros; la información diagnóstica no expone datos sensibles.
- Se mantiene el estilo del proyecto: TypeScript, indentación de dos espacios, comillas simples en JS/TS, comillas dobles en JSX y sin dependencias nuevas salvo que el alcance las requiera.

## Severidad de hallazgos

Asignar una severidad por impacto demostrado, no por el tamaño del diff:

| Severidad | Criterio |
|---|---|
| **Crítica** | Permite acceso no autorizado, expone credenciales/tokens de forma explotable, autentica una sesión inválida o provoca una pérdida/compromiso grave de sesiones. Bloquea la entrega. |
| **Alta** | Rompe una regla central de login, renovación, persistencia o logout; puede dejar sesiones incorrectas o bloquear ampliamente el acceso sin una mitigación razonable. Debe resolverse antes de integrar. |
| **Media** | Produce un fallo funcional acotado, manejo de error incorrecto, brecha relevante de pruebas o incumplimiento parcial de `intent.md`/`spec.md`, con alcance o mitigación limitados. |
| **Baja** | Problema menor de claridad, mantenibilidad o cobertura periférica, sin impacto material inmediato en seguridad ni en el flujo principal. |

Un hallazgo debe incluir:

- **Severidad** y título concreto.
- **Ubicación** verificable (archivo y líneas del diff revisado).
- **Evidencia**: condición necesaria y comportamiento observado o reproducible.
- **Impacto** sobre usuario, datos, seguridad o requisito.
- **Acción recomendada** sin prescribir refactors ajenos al problema.
- **Confianza** alta, media o baja; si falta evidencia, formularlo como pregunta y no como defecto confirmado.

Ordenar primero por severidad y, dentro de cada nivel, por impacto y confianza. No duplicar un mismo defecto como varios hallazgos salvo que sean causas independientes.

## Verificación de comandos

Antes de ejecutar, revisar `package.json`, `tsconfig.json` y la configuración de pruebas para confirmar los comandos disponibles en la revisión actual. Registrar el comando exacto, resultado y cualquier limitación. No inferir éxito a partir de una configuración ni afirmar que algo se ejecutó si no se ejecutó.

En la configuración actual del proyecto se identifican:

| Verificación | Comando | Qué registrar |
|---|---|---|
| Pruebas Jest | `npm test` | Código de salida, suites y tests aprobados/fallidos; indicar si se ejecutó toda la suite o un subconjunto. |
| ESLint | `npm run lint` | Código de salida y errores relevantes. El script actual ejecuta `eslint .`; reportar si encuentra archivos generados o problemas preexistentes, sin ocultarlos ni modificar archivos fuera de alcance. |
| TypeScript | `npx tsc --noEmit` | Código de salida y diagnósticos. El `package.json` actual no declara un script `typecheck`; este comando invoca el compilador TypeScript configurado por el proyecto. |

Estos comandos son los registrados o documentados al redactar esta guía; volver a comprobarlos si cambia la configuración. No añadir opciones, exclusiones ni comandos alternativos como si fueran scripts del proyecto. Si se decide ejecutar un subconjunto o una variante, anotar el comando exacto y aclarar qué no cubre. Los fallos deben reportarse tal como ocurrieron, diferenciando problemas del cambio de errores preexistentes o artefactos generados; nunca se modifica el código para presentar una verificación fallida como exitosa.

## Resultado de la revisión

Concluir con:

1. **Resumen**: alcance revisado y estado general.
2. **Hallazgos**: lista priorizada por severidad, o indicar explícitamente que no se encontraron hallazgos en el alcance revisado.
3. **Pruebas**: comandos realmente ejecutados, resultados y cobertura no verificada.
4. **Limitaciones**: archivos, plataformas, rutas o comportamientos no examinados y motivo.
5. **Cambios fuera de alcance**: enumerarlos con evidencia, sin revertirlos ni incorporarlos automáticamente.

“No se encontraron hallazgos” no significa que el sistema sea libre de defectos: acotar siempre la conclusión al diff, comportamiento y verificaciones examinados.