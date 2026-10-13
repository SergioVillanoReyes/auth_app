# Especificación funcional: login con DummyJSON

## Propósito y límites

Esta especificación convierte la intención de `intent.md` en comportamientos observables para login, restauración y renovación de sesión y logout. No prescribe componentes, clases, interceptores ni organización de archivos.

La funcionalidad usa la autenticación de demostración de DummyJSON. No incluye registro, recuperación de credenciales, OAuth, perfiles completos ni autorización por roles.

## Contrato documentado de DummyJSON

Según la [documentación oficial de autenticación de DummyJSON](https://dummyjson.com/docs/auth):

| Operación | Solicitud documentada | Respuesta documentada y alcance |
|---|---|---|
| Login | `POST https://dummyjson.com/auth/login`, JSON con `username` y `password`; `expiresInMins` es opcional y su valor predeterminado documentado es 60 minutos. | Datos del usuario y `accessToken` y `refreshToken`. Se pueden usar credenciales de usuarios disponibles en DummyJSON. |
| Verificar usuario autenticado | `GET https://dummyjson.com/auth/me`, con access token en `Authorization` como bearer. | Datos del usuario autenticado. |
| Renovar sesión | `POST https://dummyjson.com/auth/refresh`, JSON con `refreshToken`; este campo es opcional para clientes que usan cookies. `expiresInMins` es opcional, aplica al access token y su valor predeterminado documentado es 60 minutos. | Nuevos `accessToken` y `refreshToken`. |

La documentación muestra el uso de cookies (`credentials: 'include'`) además de devolver tokens en el cuerpo. Esta especificación basa la sesión de la aplicación en los tokens de respuesta persistidos; no requiere cookies.

La documentación consultada no define suficientemente los códigos y cuerpos de error de cada operación, la duración o caducidad del refresh token, ni garantías de revocación, reutilización o rotación del refresh token. No deben darse por supuestas; véase **Limitaciones y decisiones pendientes**.

## Reglas funcionales

### 1. Login

1. El formulario solicita usuario y contraseña.
2. No se envía la solicitud si alguno de los campos está vacío o contiene solo espacios. Se muestra un mensaje asociado al campo o al formulario y el usuario permanece en Login.
3. Para una entrada admisible, la app envía las credenciales a `POST /auth/login`. No transforma silenciosamente el nombre de usuario ni la contraseña.
4. Mientras espera respuesta, indica que el acceso está en curso y evita envíos duplicados desde el formulario.
5. Si la respuesta incluye correctamente ambos tokens, se guardan los dos y se muestra Home solo después de completar el inicio de sesión y conservar la sesión.
6. Si DummyJSON rechaza las credenciales, se muestra un error comprensible, no se guardan tokens de esa respuesta y el usuario permanece en Login con los campos disponibles para corregirlos.
7. Si falla la conexión o el servicio no está disponible, se informa del problema, no se trata como credenciales inválidas y se permite reintentar.
8. Una respuesta incompleta o que no incluya los tokens requeridos no establece una sesión autenticada; se muestra un error y no se navega a Home.

### 2. Inicialización y restauración de sesión

1. En cada inicio de la aplicación se muestra el estado de carga mientras se recupera y verifica la sesión. No se muestra Login ni Home hasta determinar el destino; la carga no es un paso manual posterior al login.
2. Si la clave de sesión no existe, se considera que no hay sesión y se dirige a Login.
3. Si la sesión almacenada existe pero está incompleta, malformada o contiene tokens vacíos, se considera dato inválido, no ausencia. Debe limpiarse con `cleanStorage` antes de completar la transición a Login. Si la limpieza falla, se informa del error, se permanece en el estado de inicialización y se permite reintentar.
4. Si `StorageModule.getItem` falla, el error se propaga como fallo de almacenamiento. No se interpreta como ausencia de sesión ni se dirige a Login como si no hubiera tokens; se informa del problema y se permite reintentar.
5. Si existe una pareja de tokens y el access token permite verificar al usuario mediante `GET /auth/me`, se dirige a Home sin pedir credenciales.
6. Si la verificación informa que el access token no es aceptado, se intenta renovar la sesión con el refresh token antes de decidir el destino.
7. Si la renovación tiene éxito, se persiste la nueva pareja de tokens, se verifica la sesión usando el nuevo access token y se dirige a Home solo si la verificación tiene éxito.
8. Si la sesión es rechazada definitivamente —incluida una renovación rechazada por DummyJSON— se limpia el almacenamiento y se dirige a Login solo después de completar la limpieza.
9. Si no se puede verificar o renovar por conectividad o indisponibilidad del servicio, no se declara inválida la sesión ni se dirige automáticamente a Login. Se mantiene el estado de inicialización, se informa del problema y se ofrece reintentar. Home no se considera verificado mientras la comprobación no concluya.
10. Reintentar vuelve a realizar la comprobación necesaria con los tokens actuales; no solicita credenciales salvo que la sesión ya no pueda recuperarse.

### 3. Tokens y renovación

- **Access token:** credencial enviada como bearer a `/auth/me` y a las operaciones protegidas. Es el token de acceso de vida limitada; el login y la renovación documentan 60 minutos por defecto, con `expiresInMins` opcional.
- **Refresh token:** credencial presentada a `POST /auth/refresh` para obtener una nueva pareja de tokens sin volver a enviar usuario y contraseña.
- Ambos tokens son necesarios para restaurar y renovar la sesión de esta funcionalidad. Una sesión con solo uno de ellos no se considera completa ni renovable.
- Se intenta renovar si el access token ha expirado/no es aceptado durante la restauración o si una operación autenticada recibe un rechazo de autenticación. Un error de red o de servicio no prueba que el token haya expirado y no inicia por sí solo una renovación.
- Una renovación aceptada debe proporcionar ambos tokens. La nueva pareja sustituye a la anterior; solo después de persistir la nueva pareja y verificar el access token se continúa con la operación o se confirma Home.
- Si guardar la pareja nueva falla, no se confirma el login ni la renovación, no se presenta Home autenticado y no se continúa una operación protegida como si la renovación hubiera concluido. La existencia de tokens anteriores no demuestra que sean válidos. El estado real debe determinarse mediante una lectura exitosa y la verificación correspondiente; cualquier error de lectura se trata como fallo de almacenamiento. No se presume atomicidad ni se informa éxito de persistencia.
- Si el refresh token es rechazado o la respuesta no contiene una pareja usable, la sesión deja de ser recuperable: `cleanStorage` debe completarse antes de dirigir a Login. Si la limpieza falla, no se confirma Logout/Login como estado limpio; se informa y se permite reintentar.
- Si la renovación falla por un error transitorio de conectividad/servicio, se conserva la pareja actual para permitir reintento, pero no se presenta la sesión como verificada. Se informa del problema.
- Para solicitudes concurrentes asociadas a la misma sesión, como máximo una renovación debe estar activa a la vez. Las demás esperan su resultado y usan la pareja nueva si la renovación tuvo éxito. Si falla de forma definitiva, todas siguen el resultado de sesión no recuperable; si falla transitoriamente, se informa el error sin invalidar la pareja.
- Una respuesta de autenticación rechazada después de una renovación no provoca una cadena ilimitada de renovaciones: cada solicitud original puede provocar como máximo un intento de renovación y un reintento autenticado. Si el reintento también es rechazado, se limpia el almacenamiento antes de volver a Login; si la limpieza falla, no se declara terminada la transición.
- Los errores no relacionados con autenticación no provocan renovación automática.

### 4. Cierre de sesión

1. El usuario puede cerrar la sesión desde Home.
2. Al cerrar sesión se elimina la sesión local, se descarta el estado autenticado en memoria y se navega a Login.
3. Tras completar el logout, reiniciar la aplicación no puede restaurar la sesión anterior.
4. Si el almacenamiento falla al cerrar sesión, la app no debe informar un logout completado mientras exista la posibilidad de restaurar los tokens; informa del fallo y no presenta una sesión residual como cerrada.
5. Logout es local. La documentación consultada no ofrece un endpoint de revocación de tokens, por lo que no se promete invalidar tokens en DummyJSON ni cerrar sesiones del lado del servidor.

### 5. Arquitectura y almacenamiento de sesión

- **Domain:** mantener los contratos de almacenamiento de sesión en `src/domain`, sin importar React Native ni `NativeModules`. La inspección no encontró contratos de almacenamiento existentes en `src/domain`; se añadirá un único contrato de sesión, sin duplicar interfaces. Sus operaciones serán equivalentes a `getToken(): Promise<string | null>`, `getRefreshToken(): Promise<string | null>`, `saveTokens(accessToken, refreshToken): Promise<void>` y `cleanStorage(): Promise<void>`. Los errores de almacenamiento se propagan como errores, no se convierten en sesión ausente.
- **Data / Storage:** implementar ese contrato y exponer las operaciones indicadas. La inspección no encontró actualmente implementaciones de storage en `src/data`; la única funcionalidad existente allí es HTTP/red. No añadir otro contrato en `data`.
- **Data / Datasource:** encapsular el mecanismo concreto tras un datasource/adaptador que use el `NativeModules.StorageModule` existente. La capa de dominio no conoce ni importa el módulo nativo.
- **Persistencia conjunta:** `saveTokens` conserva `accessToken` y `refreshToken` juntos en un único objeto JSON serializado bajo una sola clave mediante `StorageModule.setItem`. Las lecturas recuperan ese objeto y validan su forma y que ambos valores sean cadenas no vacías antes de exponerlos. Guardar bajo una clave reduce el riesgo de persistencia parcial frente a claves separadas, pero no garantiza atomicidad transaccional ni durabilidad ante fallos del sistema.
- **Lectura:** la clave inexistente significa que no hay sesión y las operaciones de lectura devuelven `null`. Un objeto incompleto, malformado o con tokens vacíos no constituye una sesión: no se devuelven tokens válidos ni se autentica al usuario; se comunica el estado de dato inválido para que el flujo de inicialización lo descarte mediante `cleanStorage` antes de ir a Login. Si la limpieza falla, se informa del error y se permite reintentar; no se afirma un estado de almacenamiento limpio ni se muestra Home.
- **Escritura:** un error de `setItem` impide declarar login/renovación completados o autenticar al usuario. No se muestran tokens ni credenciales en logs ni en la interfaz.
- **Eliminación:** `cleanStorage` invoca `StorageModule.removeItem` sobre la clave de sesión. Se autoriza agregar `removeItem` al módulo existente en Android y Swift, y exponerlo también en el puente Objective-C de iOS. Android conservará `EncryptedSharedPreferences`; iOS conservará `UserDefaults` y eliminará la clave con la operación de borrado correspondiente. No se crea otro módulo y no se cambian ajustes nativos ajenos al almacenamiento de esta funcionalidad.
- **Fallos:** fallos de lectura, escritura o eliminación deben rechazarse/propagarse como error visible. Ninguna capa devuelve éxito simulado, interpreta una lectura fallida como ausencia de sesión ni declara autenticación con datos incompletos.
- **Protección:** se mantienen las protecciones existentes: Android usa `EncryptedSharedPreferences` y iOS `UserDefaults`. No se afirma equivalencia de seguridad entre plataformas ni se amplía el alcance para cambiar estas protecciones.

La inspección encontró una discrepancia documental/de implementación: `AGENTS.md` menciona `ios/auth_app/StorageModuleBridge.m`, pero el archivo presente es `ios/app_pokedex/StorageModuleBridge.m`. La implementación real y su puente Swift/Objective-C actuales son la referencia para planificar el cambio; esta especificación no autoriza modificar identificadores, configuración del proyecto ni otras superficies nativas.

## Pruebas y criterios de aceptación

La implementación deberá aportar pruebas automatizadas con dependencias externas y almacenamiento controlados por mocks tipados, verificando resultados, llamadas relevantes y propagación de errores. Como mínimo, cubrir:

| ID | Escenario y resultado verificable |
|---|---|
| L-01 | Usuario o contraseña vacíos/solo espacios: no hay llamada a DummyJSON, se informa la validación y se permanece en Login. |
| L-02 | Credenciales válidas con ambos tokens: se guardan ambos y se llega a Home; el formulario muestra carga durante la petición. |
| L-03 | Credenciales rechazadas: se muestra error, no se guardan tokens y se permanece en Login. |
| L-04 | Error de red/servicio durante login: se distingue de rechazo de credenciales y se ofrece reintento. |
| L-05 | Login devuelve un cuerpo sin uno o ambos tokens: no se establece sesión ni se llega a Home. |
| S-01 | Inicio sin clave de sesión: se muestra carga durante la decisión y el destino final es Login. |
| S-02 | Inicio con sesión verificada por `/auth/me`: no se muestra Login ni Home antes de terminar la verificación; el destino final es Home sin pedir credenciales. |
| S-03 | Access token rechazado y refresh token válido: se intenta renovar antes de escoger destino; con nueva pareja aceptada y access token verificado, el destino es Home. |
| S-04 | Verificación impedida por red/servicio: no se borra la sesión ni se dirige automáticamente a Login; se informa y reintentar vuelve a verificar. |
| S-05 | `StorageModule.getItem` falla durante la restauración: el error se informa y permite reintentar; no se interpreta como ausencia ni se navega a Login/Home. |
| S-06 | La clave contiene una sesión incompleta, malformada o con tokens vacíos: el dato se distingue de ausencia y se limpia; Login solo se muestra tras limpieza exitosa. |
| S-07 | `cleanStorage` falla para una sesión inválida: no se completa la transición a Login; se informa del fallo y se permite reintentar. |
| R-01 | Renovación: la solicitud usa `POST /auth/refresh` con el refresh token; ambos tokens devueltos sustituyen a los anteriores antes de continuar. |
| R-02 | Refresh token rechazado o respuesta incompleta: se trata la sesión como irrecuperable, no se mantiene Home autenticado y el destino final es Login. |
| R-03 | Error transitorio al renovar: se conservan tokens para reintento, no se declara la sesión inválida y se presenta el error. |
| R-04 | Varias solicitudes simultáneas con la misma sesión expirada: se realiza una sola renovación concurrente; las solicitudes esperan y no envían credenciales obsoletas tras éxito. |
| R-05 | Rechazo del reintento tras renovar: no hay un segundo ciclo de renovación para la misma solicitud; se descarta la sesión y se vuelve a Login. |
| R-06 | Error de una operación no atribuible a autenticación: no se activa renovación por ese error. |
| O-01 | Logout exitoso: tokens no recuperables, estado autenticado descartado y destino Login; un reinicio no restaura la sesión. |
| O-02 | Fallo de almacenamiento en logout: la app no comunica éxito ni deja una sesión residual presentada como cerrada. |
| O-03 | Logout: no se afirma revocación remota de tokens porque no está documentada en la API consultada. |
| P-01 | La suite usa dobles de prueba para DummyJSON y `NativeModules.StorageModule`; no requiere llamadas de red reales. |
| ST-01 | Lectura sin clave: `getToken` y `getRefreshToken` indican que no hay tokens; no se autentica al usuario. |
| ST-02 | Lectura de sesión válida serializada: `getToken` devuelve access token y `getRefreshToken` devuelve refresh token de la misma sesión. |
| ST-03 | Lectura de sesión incompleta (falta uno de los tokens), malformada o con valores vacíos: no se expone ningún token utilizable ni se autentica; se informa dato inválido y se solicita limpieza. |
| ST-04 | Guardado válido: `saveTokens` persiste ambos tokens juntos como un objeto serializado bajo una única clave y solo resuelve cuando `setItem` tuvo éxito. |
| ST-05 | Fallo de `setItem` al guardar: `saveTokens` rechaza; login/renovación no se reportan exitosos y no se muestra Home. |
| ST-06 | Eliminación: `cleanStorage` llama `removeItem` para la clave de sesión y solo resuelve tras completar correctamente; un reinicio posterior informa sesión ausente. |
| ST-07 | Fallo de `getItem` o `removeItem`: el error se propaga; nunca se sustituye por `null` o éxito, ni se afirma que la sesión fue eliminada. |
| ST-08 | Datasource: el adaptador usa solo la interfaz JS del `StorageModule` existente; los contratos de `domain` no importan React Native ni `NativeModules`. |
| ST-09 | Plataformas: Android conserva `EncryptedSharedPreferences`; iOS conserva `UserDefaults`; `removeItem` elimina realmente la clave en cada plataforma y las pruebas no asumen protección equivalente. |
| ST-10 | Seguridad de datos: ningún token aparece en logs, errores visibles ni interfaz. |
| ST-11 | Si `saveTokens` falla con tokens anteriores presentes, no se confirma login/renovación ni se continúa la operación protegida; los tokens anteriores no se declaran válidos sin una lectura y verificación exitosas. |

Las pruebas deben incluir mocks tipados del contrato de dominio, del datasource y de `NativeModules.StorageModule`; verificar llamadas y propagación de errores, sin llamadas de red reales. Además, deben probar que los errores de almacenamiento al guardar una nueva pareja impiden confirmar autenticación/Home y se hacen visibles; una pareja parcialmente persistida nunca debe presentarse como sesión verificada. Las pruebas nativas de `removeItem` deben comprobar la eliminación efectiva de la clave en Android e iOS.

## Limitaciones y decisiones pendientes para revisión humana

1. **Errores de DummyJSON:** la documentación oficial consultada no especifica los estados HTTP y cuerpos exactos de errores para credenciales inválidas, refresh inválido ni indisponibilidad. La implementación debe distinguir rechazo definitivo de error transitorio a partir del contrato observable y pruebas; los casos no clasificables requieren manejo conservador y no deben borrar sesión por un mero fallo de red.
2. **Vigencia del refresh token:** la documentación muestra que refresh devuelve una nueva pareja, pero no fija duración, políticas de rotación/reutilización ni revocación. La renovación debe usar el refresh token más reciente devuelto, sin prometer una vigencia indefinida.
3. **Duración de access token:** la documentación establece 60 minutos por defecto y permite `expiresInMins`, pero no hay una duración de producto acordada. Esta especificación no elige un valor alternativo.
4. **Protección por plataforma:** Android e iOS ofrecen protecciones distintas. Se mantienen las existentes y no se plantea hacerlas equivalentes.
5. **Ubicación del puente iOS:** `AGENTS.md` cita una ruta distinta de la existente (`ios/app_pokedex/StorageModuleBridge.m`). Debe respetarse la ruta y organización reales del proyecto al implementar; no se cambia el identificador/configuración de la app por esta discrepancia.