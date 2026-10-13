# Plan de implementación: login con DummyJSON

## 1. Objetivo y alcance

Implementar el flujo definido en [intent.md](./intent.md) y [spec.md](./spec.md): login, restauración inicial de sesión, verificación con DummyJSON, renovación con refresh token, persistencia conjunta, cierre de sesión y estados de error/reintento.

El trabajo abarcará domain, data, composición, presentación y las implementaciones existentes de `StorageModule` para habilitar borrado real. Se conservarán las plataformas y dependencias actuales.

Queda excluido: registro, recuperación de contraseña, OAuth, perfiles/roles, cambios de dependencias, configuración nativa ajena al almacenamiento, cambios de permisos/identificadores/certificados, alteraciones a Talsec/RASP y equivalencia de seguridad entre Android e iOS.

## 2. Estado actual

- **Arquitectura:** `src/domain` y `src/core/di` no tienen archivos. `src/data` contiene únicamente utilidades HTTP/red. Las carpetas de capas futuras se describen en [ARCHITECTURE.md](../../../ARCHITECTURE.md); son espacios reservados, no implementaciones existentes.
- **Entrada y navegación:** [App.tsx](../../../App.tsx) instala Safe Area y renderiza [AppNavigator](../../../src/presentation/navigation/AppNavigator.tsx). El navegador actual muestra directamente [HomeScreen](../../../src/presentation/screens/HomeScreen/index.tsx); no hay Login, estado de inicialización de sesión ni biblioteca de navegación declarada.
- **HTTP:** [HttpClient](../../../src/data/http/HttpClient.ts) implementa solo GET y utiliza [INetworkChecker](../../../src/data/http/INetworkChecker.ts). [NetworkChecker](../../../src/data/http/NetworkChecker.ts) consulta `https://www.google.com` con HEAD; [HttpError](../../../src/data/http/HttpError.ts) representa estado/mensaje. No hay API de autenticación.
- **Almacenamiento JS:** no se encontraron interfaces ni implementaciones en `src/domain` o `src/data`, ni adaptador JavaScript al módulo nativo.
- **Android:** [StorageModule.kt](../../../android/app/src/main/java/com/auth_app/StorageModule.kt) expone `getItem`/`setItem` con promesas y usa `EncryptedSharedPreferences`; [StoragePackage.kt](../../../android/app/src/main/java/com/auth_app/StoragePackage.kt) crea el módulo y [MainApplication.kt](../../../android/app/src/main/java/com/auth_app/MainApplication.kt) lo registra. No existe `removeItem`.
- **iOS:** [StorageModule.swift](../../../ios/StorageModule.swift) expone `getItem`/`setItem` con `UserDefaults`; [StorageModuleBridge.m](../../../ios/app_pokedex/StorageModuleBridge.m) exporta ambos al bridge. No existe `removeItem`. La ruta real del bridge difiere de la citada en `AGENTS.md`; se debe usar la ruta real.
- **Pruebas:** Jest usa preset React Native y Babel en [jest.config.js](../../../jest.config.js). Hay una prueba de render de App/Home en [App.test.tsx](../../../__tests__/App.test.tsx) y pruebas del cliente HTTP en [HttpClient.test.ts](../../../src/__tests__/data/http/HttpClient.test.ts). No se encontraron pruebas de domain, storage, presentación de login ni pruebas nativas del módulo. `package.json` ofrece `npm test`, `npm run lint`, `npm start`, `npm run android` y `npm run ios`; no tiene script de typecheck. TypeScript incluye archivos `.ts`/`.tsx` ampliamente.
- **Estilo y límites:** TypeScript/React Native, Jest con mocks tipados; dos espacios, comillas simples en TS y sin `any` explícito. Domain debe seguir independiente de data y presentation; la composición se ubicará en `src/core/di`.

## 3. Cambios propuestos

Los nombres siguientes son rutas nuevas propuestas; deben verificarse al implementarse para evitar duplicar archivos añadidos mientras tanto.

### Archivos nuevos

| Archivo propuesto | Responsabilidad |
|---|---|
| `src/domain/storage/ISessionStorage.ts` | Contrato independiente de plataforma para `getTokens`, `saveTokens` y `cleanStorage`. `getTokens` devuelve la pareja completa o `null` si no existe la clave; dato inválido y fallos de I/O son errores diferenciables. |
| `src/domain/storage/InvalidStoredSessionError.ts` | Distinguir dato guardado malformado/incompleto de clave inexistente y de error de lectura. |
| `src/domain/auth/IAuthRepository.ts` | Contrato de login, verificación de sesión y operaciones autenticadas, sin acceso a fetch ni React Native. |
| `src/domain/auth/AuthCredentials.ts`, `AuthTokens.ts`, `AuthUser.ts` | Tipos de credenciales, pareja de tokens y usuario estrictamente necesarios por los flujos. |
| `src/domain/usecases/LoginUseCase.ts`, `RestoreSessionUseCase.ts`, `LogoutUseCase.ts` | Orquestación de login, restauración y logout sin depender de presentation o data. No contienen coordinación de renovación concurrente ni lógica duplicada de reintento. |
| `src/data/datasource/NativeStorageDataSource.ts` | Adaptador del `NativeModules.StorageModule` existente, tipado y único punto de contacto JS con la API nativa. |
| `src/data/storage/SessionStorage.ts` | Implementación de `ISessionStorage`; serialización/validación de la pareja de tokens bajo una clave; propagación de errores. |
| `src/data/datasource/DummyJsonAuthDataSource.ts` | Solicitudes a `/auth/login`, `/auth/me` y `/auth/refresh`, mapeo de respuesta/errores y encabezado bearer cuando corresponde. |
| `src/data/models/auth/*` | Modelos de transporte solo si son necesarios para validar la respuesta y mapearla a tipos domain; no duplicar tipos de dominio sin propósito. |
| `src/data/repositories/AuthRepository.ts` | Implementación del contrato de autenticación. Es el único responsable de coordinar la renovación single-flight por sesión, compartir su resultado con solicitudes concurrentes y limitar a un intento de renovación y un reintento por solicitud. Ni los casos de uso ni `HttpClient` replican esta coordinación. |
| `src/core/di/authDependencies.ts` | Composición de HTTP, datasources, repositorio, storage y casos de uso; no contiene lógica de pantalla. |
| `src/presentation/context/AuthContext.tsx` | Exponer estado de inicialización/autenticación, acciones de login/logout y reintento a la navegación/pantallas. |
| `src/presentation/screens/LoginScreen/index.tsx` y `src/presentation/screens/AuthLoadingScreen/index.tsx` | Presentar formulario, feedback y carga de inicialización; sin credenciales/tokens en logs o texto de error. |

| Archivo de prueba propuesto | Responsabilidad |
|---|---|
| Pruebas Jest focalizadas bajo `src/__tests__/` | Mocks tipados y promesas controladas para almacenamiento, API/repositorio, casos de uso y navegación. Se agrupan por responsabilidades y cubren los criterios de aceptación sin crear una infraestructura genérica de pruebas. |

### Archivos existentes a modificar

| Archivo | Responsabilidad del cambio |
|---|---|
| `App.tsx` | Conectar el proveedor/estado de autenticación y mantener Safe Area. |
| `src/presentation/navigation/AppNavigator.tsx` | Resolver de forma mutuamente excluyente la carga inicial, Login y Home; evitar mostrar una pantalla incorrecta durante la restauración. |
| `src/presentation/screens/HomeScreen/index.tsx` | Añadir la acción básica de logout según las capacidades actuales de componentes/tema. |
| `src/data/http/HttpClient.ts` | Añadir el soporte HTTP POST y encabezados requerido por auth manteniendo GET y su comportamiento actual. |
| `android/app/src/main/java/com/auth_app/StorageModule.kt` | Añadir `removeItem` sobre las preferencias cifradas existentes y rechazar la promesa si la operación falla. |
| `ios/StorageModule.swift` | Añadir `removeItem` mediante `UserDefaults.removeObject` y propagar fallos si los hubiera. |
| `ios/app_pokedex/StorageModuleBridge.m` | Exportar `removeItem` al bridge con la firma de promesa correspondiente. |
| `src/__tests__/data/http/HttpClient.test.ts` | Cubrir POST/headers/error sin regresionar GET. |
| `__tests__/App.test.tsx` | Adaptar pruebas de render e integración de App a los estados de auth, sin eliminar verificaciones existentes para forzar el paso. |

Se añadirán o modificarán pruebas de feature para cubrir los criterios de [spec.md](./spec.md). No se cambiarán dependencias, archivos de lock, configuración nativa ni archivos generados.

## 4. Secuencia de implementación

1. **Contratos de almacenamiento en domain:** definir una sola interfaz `ISessionStorage` con `getTokens(): Promise<AuthTokens | null>`, `saveTokens(tokens)` y `cleanStorage()`. `null` representa exclusivamente la clave inexistente; sesión incompleta/malformada genera un error específico y fallos del módulo se propagan como fallos de almacenamiento. No se definen además getters independientes por token: leer la pareja de una clave una sola vez evita que restauración o renovación mezclen snapshots. Mantener la API independiente de React Native.
2. **Datasource y almacenamiento de sesión:** encapsular el NativeModule; implementar serialización conjunta, validación al leer, propagación de fallos y las tres operaciones de sesión. Restauración y renovación obtienen una única pareja con `getTokens()` y la mantienen como snapshot durante esa decisión; no vuelven a leer access y refresh por separado.
3. **Borrado nativo:** añadir `removeItem` al módulo Android existente y al módulo Swift/bridge real de iOS. Conservar registro, identificadores, mecanismos de protección actuales y APIs existentes. Verificar compilación de ambas plataformas.
4. **Pruebas de almacenamiento:** con mocks tipados y respuestas/promesas controladas, probar clave ausente, objeto válido, estructura malformada/incompleta/vacía, escritura conjunta, borrado y fallos de `getItem`, `setItem` y `removeItem`. Comprobar que fallos nunca producen una respuesta exitosa.
5. **Transporte y API de DummyJSON:** extender `HttpClient` para POST/headers, manteniendo GET; implementar login, `/auth/me` y refresh y mapear respuestas y errores sin exponer secretos. Probar errores de red, no-OK y cuerpos incompletos.
6. **Autenticación y restauración:** conectar contratos/use cases para validar tokens con `/auth/me`, renovar cuando la autenticación sea rechazada, persistir el par nuevo y verificarlo antes de Home. Diferenciar rechazo de auth de errores transitorios. La restauración obtiene un único `AuthTokens` con `getTokens()`.
7. **Coordinación única de renovación:** implementar en `AuthRepository` un único coordinador single-flight por sesión. Las solicitudes concurrentes comparten la misma promesa/resultado; una renovación exitosa persiste el par nuevo y las solicitudes esperan antes de usarlo. Cada operación protegida admite como máximo un intento de refresh y un reintento; `HttpClient` se limita al transporte y los casos de uso delegan, sin mecanismos concurrentes duplicados. Usar capacidades nativas de TypeScript/JavaScript, sin dependencias adicionales.
8. **Concurrencia y logout:** ordenar las mutaciones de sesión para que una respuesta tardía de login/refresh no repueble el almacenamiento tras logout. Probar casos críticos con promesas diferidas controladas, sin montar un framework de concurrencia o infraestructura genérica.
9. **Login y logout:** implementar validación/form feedback; guardar ambos tokens antes de marcar autenticado. Logout limpia almacenamiento antes de confirmar navegación; fallo de limpieza visible y reintentable.
10. **Composición e integración UI:** cablear dependencias en `src/core/di`, contexto/estado de autenticación y navegación. Mostrar carga al inicio; solo presentar Home tras verificación, o Login tras ausencia/limpieza exitosa/rechazo definitivo. En errores de red o storage mostrar error y reintento sin asumir sesión inválida.
11. **Pruebas y verificación:** completar pruebas focalizadas de aceptación; ejecutar tests, lint y typecheck. Verificar Android/iOS nativos mediante la validación disponible y documentar cualquier limitación del entorno.

## 5. Estrategia de pruebas

- **Domain/use cases:** mocks tipados de `ISessionStorage` y `IAuthRepository`; validar login, restauración con una pareja obtenida por una única llamada a `getTokens`, clasificación de ausencia/dato inválido/fallo de almacenamiento, reintento y logout.
- **Datasource de almacenamiento:** mock tipado de la API de `StorageModule`, verificando parámetros, clave única, serialización, deserialización, parseo malformado, valores vacíos y propagación de errores. No usar `as any`.
- **Storage implementation:** comprobar que ambos tokens pertenecen al mismo objeto y que `getTokens` no mezcla lecturas; resolver solo tras respuesta exitosa del datasource. No afirmar rollback/atomicidad si `setItem` rechaza.
- **Auth data/repository:** fetch/HttpClient mockeado; probar contratos DummyJSON, bearer en `/auth/me`, respuesta refresh con ambos tokens, respuesta incompleta, status no autorizado, errores de red/servicio.
- **Concurrencia:** pruebas deterministas de `AuthRepository`, usando promesas diferidas controladas para demostrar una única renovación concurrente, solicitudes que comparten resultado, uso de la pareja nueva y límite de reintento. Añadir solo los casos necesarios de logout mientras login/refresh está pendiente para demostrar que una respuesta tardía no restaura la sesión.
- **Presentation/App:** `react-test-renderer` como el test actual; probar que al montar no se muestra Home/Login antes del resultado, Home tras sesión verificada, Login sin sesión o tras limpieza, reintento ante fallo y feedback de login/logout.
- **Android/iOS:** no se localizaron suites nativas existentes. Verificar compilación donde el entorno lo permita y ejecutar una comprobación manual focalizada de `removeItem` en cada plataforma; no añadir infraestructura o dependencias de test nativo en esta tarea sin necesidad demostrada. Comprobar que las promesas reportan fallos y que el módulo/bridge siguen registrados.
- **Regresión y estilo:** conservar las pruebas de `HttpClient.get`, prueba actual App/Home y estilo ESLint. No ajustar expectativas para ocultar comportamiento incorrecto.

## 6. Riesgos y decisiones

- **Errores DummyJSON sin contrato exhaustivo:** sus respuestas/status de credenciales o refresh inválidos no están completamente descritos en la documentación consultada. Clasificar como rechazo definitivo solo señales inequívocas de autenticación; errores de red/servicio y no clasificables deben conservar el dato y permitir reintentar, nunca enviarlo directamente a Login como sesión inexistente.
- **Persistencia tras fallo:** escritura de pareja en una clave reduce, pero no elimina, estados ambiguos: el módulo usa preferencias/promesas y no ofrece transacción. Si `saveTokens` falla, no confirmar login/refresh ni una operación protegida, y no considerar válidos tokens anteriores sin leer y verificar el estado real. No afirmar rollback.
- **Lectura, dato inválido y ausencia:** `getItem` debe propagar fallos; solo valor nulo representa clave ausente. Datos inválidos requieren `cleanStorage` exitoso antes de Login. Un fallo de borrado mantiene estado no resuelto con reintento.
- **Lectura coherente:** el contrato propuesto `getTokens()` devuelve el objeto almacenado como pareja en una lectura; no se añaden getters separados que puedan observar estados distintos.
- **`NetworkChecker`:** actualmente verifica internet consultando Google, no DummyJSON; puede fallar aunque el API esté disponible. Durante el transporte de autenticación decidir si se reutiliza o se modifica el uso para que la respuesta del API determine disponibilidad. No clasificar error de esa comprobación como credenciales inválidas ni como token inválido.
- **Nativo/plataforma:** Android conserva `EncryptedSharedPreferences`; iOS conserva `UserDefaults` y ofrece una protección distinta. No se prometen equivalencia ni mejoras fuera de alcance. El puente iOS real está en `ios/app_pokedex/StorageModuleBridge.m`, distinto de la ruta de `AGENTS.md`.
- **No hay navegación declarada:** no existe biblioteca de navegación en dependencias; integrar los estados en la estructura actual sin añadir dependencias, salvo nueva aprobación.
- **Vigencia del refresh token y duración elegida:** DummyJSON no documenta completamente vencimiento, rotación/revocación de refresh token; usar la pareja más reciente y no asumir duración indefinida. La duración default de access token documentada es 60 minutos; no escoger otro valor sin decisión.
- **Sesiones concurrentes/logout:** `AuthRepository` es el único coordinador de renovación single-flight/reintentos. También debe impedir que una respuesta tardía repueble almacenamiento tras logout; los casos mínimos se prueban con promesas controladas, sin introducir dependencias.
- **Cobertura nativa:** no se localizaron pruebas nativas de StorageModule en el inventario leído. Confirmar herramientas/estructura Android e iOS antes de fijar el método de test.

## 7. Criterios de finalización

- Se cumplen todos los criterios de aceptación funcionales y de storage de [spec.md](./spec.md), incluidos errores, concurrencia y logout.
- El dominio no importa React Native ni `NativeModules`; un único contrato de almacenamiento expone `getTokens`, `saveTokens` y `cleanStorage`; `data/storage` lo implementa y `data/datasource` encapsula el módulo.
- La restauración/renovación lee la pareja mediante una única operación `getTokens`; `AuthRepository` es el único propietario de la coordinación concurrente y los límites de reintento.
- Login/restauración solo establecen Home con tokens completos, storage exitoso y sesión verificada; los fallos de almacenamiento no se convierten en ausencia ni éxito.
- `removeItem` funciona en el módulo existente de Android y en Swift/bridge iOS; se conserva el almacenamiento protegido actual y no se alteran otras configuraciones nativas.
- `npm test` y `npm run lint` pasan; `npx tsc --noEmit` pasa. Si iOS no puede verificarse en el entorno actual, informar explícitamente y dejarlo como validación pendiente.
- La app compila/arranca en Android y iOS cuando los SDK/plataformas estén disponibles, o quedan documentadas las limitaciones ambientales. No se modifican dependencias, lockfiles ni artefactos de build.
- No hay tokens/credenciales en UI ni logs; quedan sin regresión las pruebas existentes que correspondan.