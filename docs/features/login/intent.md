# Intención de la funcionalidad: login con DummyJSON

## Problema que resuelve

La aplicación necesita permitir el acceso de usuarios registrados a través de una autenticación basada en credenciales reales, con una experiencia clara y repetible en cada apertura de la app cuando el usuario ya ha iniciado sesión previamente.

La funcionalidad responde a la necesidad de validar el acceso del usuario en un backend externo, sin depender de una lógica mockeada ni de un flujo de acceso manual no persistente.

## Usuario y valor

El usuario principal es una persona que ya dispone de credenciales válidas en la API de demostración de DummyJSON y desea entrar de forma segura a la aplicación para acceder a una vista autenticada.

El valor aportado es que la app puede conservar la sesión iniciada y recordar el acceso al volver a abrirla, reduciendo la fricción de entrada y manteniendo una experiencia coherente entre sesiones válidas.

## Alcance inicial

Se incluye en esta etapa:

- acceso con usuario y contraseña mediante la API de autenticación de DummyJSON
- validación mínima de entrada antes del envío de la petición
- manejo de errores de login y feedback visible para el usuario
- persistencia de la sesión autenticada al cerrar y volver a abrir la app, siempre que el token siga siendo válido
- renovación automática de la sesión utilizando el refresh token de DummyJSON cuando sea necesario, sin solicitar nuevamente las credenciales al usuario mientras la renovación sea posible
- actualización de los tokens almacenados tras una renovación exitosa
- gestión de los casos en los que la renovación falle, evitando mantener una sesión autenticada que ya no pueda recuperarse
- acceso a Home, una pantalla sencilla de inicio autenticado, tras un login exitoso
- flujo básico de cierre de sesión que elimine el token almacenado y regrese al login

Al abrir la aplicación, debe mostrarse una pantalla de carga mientras se recupera y verifica el estado de la sesión. Si existe una sesión válida, el usuario debe llegar a Home; si no hay tokens o la sesión es rechazada, debe llegar a Login. Cuando el access token necesite renovación y el refresh token siga siendo válido, se intentará renovar la sesión antes de decidir el destino. La carga es un estado transitorio de inicialización, no una pantalla que el usuario atraviese manualmente después del login.

Si la verificación no puede completarse por un error de conexión o por indisponibilidad de DummyJSON, la aplicación debe informar del problema y permitir reintentar, sin asumir que la sesión es inválida.

Se excluye explícitamente del alcance inicial:

- registro de nuevos usuarios
- recuperación de contraseña
- autenticación con redes sociales o OAuth
- opción de "recordarme" como funcionalidad diferenciada
- gestión avanzada de roles, permisos o perfiles
- refinamiento visual ni diseño completo de UX
- nuevos módulos de almacenamiento distintos a `NativeModules.StorageModule`
- detalles de implementación de renovación de tokens en capas técnicas específicas, interceptores o mecanismos de flujo que aún no correspondan a una especificación formal

## Resultados esperados desde la perspectiva del usuario

El usuario debería poder:

- identificar una pantalla de acceso clara y segura
- introducir sus credenciales para iniciar sesión
- recibir feedback útil si el acceso falla
- volver a entrar automáticamente a la app si ya tiene una sesión válida guardada
- acceder a una pantalla sencilla de inicio autenticado tras el login exitoso
- cerrar sesión y regresar al flujo de login sin dejar una sesión residual almacenada
- ver una pantalla de carga mientras se determina el destino inicial, sin que se muestre temporalmente Login o Home antes de confirmar el estado de la sesión
- recibir un aviso y poder reintentar si un problema de conexión impide verificar o renovar la sesión

En términos funcionales, la experiencia debe ser clara, rápida y consistente en sesiones sucesivas, sin exigir que el usuario repita el login mientras la sesión sea válida o pueda renovarse.

## Riesgos, restricciones y preguntas pendientes

### Riesgos

- la API de DummyJSON puede responder con errores, tiempos de respuesta variables o tokens no válidos
- la persistencia de la sesión depende de la disponibilidad del almacenamiento nativo y del estado del token
- la diferencia actual de protección del almacenamiento entre Android e iOS debe reconocerse como riesgo: no se puede asumir que ambas plataformas ofrecen el mismo nivel de protección ni equivalencia de seguridad en el almacenamiento
- un error de conectividad durante la verificación no debe confundirse con una sesión inválida; la aplicación debe informar al usuario y permitir reintentar
- si la sesión no se valida correctamente, puede producirse un acceso indebido o una experiencia inconsistente al reabrir la aplicación

### Restricciones

- esta tarea no modifica la configuración nativa ni dependencias del proyecto
- la funcionalidad debe reutilizar el `NativeModules.StorageModule` ya existente para almacenar y recuperar el token, sin crear otro módulo de almacenamiento
- el alcance se mantiene orientado a la intención de la funcionalidad y no avanza hacia detalles de implementación que corresponden a una especificación o plan de trabajo

### Preguntas pendientes

No quedan decisiones de alcance pendientes para el comportamiento de inicialización de sesión descrito aquí. Los criterios técnicos para verificar y renovar la sesión se definirán en la especificación funcional.

## Estado de la intención

Esta intención define el problema, el valor y el alcance del login con DummyJSON, manteniendo la sesión persistente como comportamiento predeterminado y reconociendo el uso del almacenamiento nativo ya existente. El objetivo es servir como base de intención antes de avanzar a una especificación o a un plan más detallado, si se decide continuar con la entrega funcional.
