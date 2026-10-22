# Plan: catálogo de productos DummyJSON

## Objetivo y límites

Implementar listado, búsqueda al enviar el formulario y detalle de productos dentro del Home autenticado, con estados de carga, error y vacío, preservando el flujo existente de login/logout.

No se modificará `HttpClient.ts`. No se agregarán dependencias ni librerías de navegación. Las solicitudes y el estado del catálogo no modificarán la autenticación ni los tokens.

## Estado inspeccionado del repositorio

Los siguientes archivos y ubicaciones existen y fueron inspeccionados al preparar este plan:

| Archivo o ubicación existente | Hecho comprobado |
|---|---|
| `AGENTS.md` | Define stack, capas, convenciones, restricciones y comandos generales del proyecto. |
| `ARCHITECTURE.md` | Describe la arquitectura por capas; algunas descripciones del estado inicial son anteriores a la implementación actual, por lo que se verificó el código presente. |
| `src/data/http/HttpClient.ts` | Existe y soporta `GET` y `POST`. No se modificará. Convierte errores no representados como `HttpError`, incluidos ciertos errores de parseo JSON, en `HttpError` con estado `0`. |
| `src/data/http/HttpError.ts` | Representa errores HTTP con estado y mensaje. |
| `src/core/di/authDependencies.ts` | Existe y compone dependencias de autenticación. La propuesta mantendrá separada la composición de productos. |
| `src/data/repositories/AuthRepository.ts` | Existe y coordina operaciones de autenticación/sesión. No se reutilizará para productos. |
| `src/domain/auth/IAuthRepository.ts` | Contrato de autenticación; no define operaciones de catálogo. |
| `src/presentation/context/AuthContext.tsx` | Mantiene el estado y las acciones de autenticación, incluido logout. |
| `src/presentation/navigation/AppNavigator.tsx` | Selecciona Login, carga o Home según el estado de autenticación. No se encontró una librería de navegación declarada. |
| `src/presentation/screens/HomeScreen/index.tsx` | Home muestra el saludo del usuario y la acción de logout. La integración debe conservar ambos. |
| `src/__tests__/data/http/HttpClient.test.ts` | Prueba HTTP existente de GET, POST, headers y errores. No se cambiará si el cliente HTTP no se modifica. |
| `src/__tests__/data/repositories/AuthRepository.test.ts` | Prueba autenticación, renovación, persistencia y concurrencia. Debe conservarse como regresión. |
| `src/__tests__/presentation/context/AuthContext.test.tsx` | Prueba estado de autenticación y logout. Debe conservarse como regresión. |
| `__tests__/App.test.tsx` | Pruebas raíz de integración/render de App y Home. Deben conservarse; se podrá ampliar la cobertura sin retirar aserciones existentes. |
| `src/__tests__/` | Estructura real observada: pruebas organizadas en `data`, `domain` y `presentation`. Hay pruebas de HTTP y autenticación; no se encontraron pruebas del catálogo. |
| `package.json`, `tsconfig.json`, `jest.config.js` | Revisados para identificar dependencias y comandos disponibles. No se propone cambiar dependencias ni configuración. |

No se encontraron implementaciones actuales de productos: tipo/entidad de dominio, contrato de repositorio, caso de uso, datasource, repositorio o pantalla de catálogo.

## Archivos nuevos propuestos

Estas rutas son propuestas, no archivos existentes. Confirmar que siguen siendo adecuadas al implementar.

| Ruta nueva propuesta | Responsabilidad |
|---|---|
| `src/domain/products/Product.ts` | Tipo de dominio con `id`, `title`, `price`, `category`, `description` y `thumbnail` opcional. |
| `src/domain/products/IProductsRepository.ts` | Contrato para listar/buscar productos y obtener un producto por ID. |
| `src/domain/usecases/GetProductsUseCase.ts` | Obtener el listado o buscar por término; un query vacío solicita el listado general. |
| `src/domain/usecases/GetProductByIdUseCase.ts` | Obtener detalle de producto por ID. |
| `src/data/datasource/DummyJsonProductsDataSource.ts` | Consultar endpoints de DummyJSON con el `HttpClient` existente, codificar el query y validar/mapear las respuestas externas. |
| `src/data/repositories/ProductsRepository.ts` | Implementar el contrato del dominio y propagar errores sin depender del repositorio de autenticación. |
| `src/core/di/productsDependencies.ts` | Componer datasource, repositorio y casos de uso sin acoplarlos a `authDependencies.ts`. |
| `src/presentation/screens/ProductsCatalogScreen/index.tsx` | Presentar catálogo, búsqueda, estados vacíos/errores/reintentos y detalle mediante estado local; descartar respuestas obsoletas. |
| `src/__tests__/data/datasource/DummyJsonProductsDataSource.test.ts` | Probar rutas, query codificado, validación de respuestas y errores. La carpeta `data/datasource` existe; este archivo no. |
| `src/__tests__/data/repositories/ProductsRepository.test.ts` | Probar delegación y propagación de errores si el repositorio contiene reglas propias. La carpeta `data/repositories` existe; este archivo no. |
| `src/__tests__/domain/usecases/GetProductsUseCase.test.ts` | Probar listado, búsqueda y query vacío. La carpeta `domain/usecases` existe; este archivo no. |
| `src/__tests__/domain/usecases/GetProductByIdUseCase.test.ts` | Probar delegación de consulta de detalle. La carpeta `domain/usecases` existe; este archivo no. |
| `src/__tests__/presentation/screens/ProductsCatalogScreen.test.tsx` | Probar estados de UI, reintentos, conservación de resultados y respuestas obsoletas. La carpeta `presentation/screens` es una ruta nueva propuesta dentro de `src/__tests__/presentation`, no una carpeta de pruebas existente. |

## Archivos existentes propuestos para modificar

| Archivo existente | Cambio propuesto |
|---|---|
| `src/presentation/screens/HomeScreen/index.tsx` | Integrar la pantalla del catálogo en Home conservando el saludo y el acceso a logout tanto en catálogo como en detalle. |
| `__tests__/App.test.tsx` | Solo ampliar si hace falta una comprobación de integración para Home/logout; conservar todas las aserciones existentes. |
| `src/__tests__/presentation/context/AuthContext.test.tsx` | No modificar inicialmente. Añadir una prueba de regresión solo si la integración afecta directamente el comportamiento del contexto; no cambiar aserciones existentes. |

No se propone modificar `src/data/http/HttpClient.ts`, `src/__tests__/data/http/HttpClient.test.ts`, `src/core/di/authDependencies.ts`, contratos de autenticación, almacenamiento nativo, configuración nativa o dependencias.

## Diseño propuesto

- Mantener el saludo y el botón de logout en una zona persistente del Home.
- Presentar catálogo y detalle dentro del área de contenido de Home.
- Representar la selección del producto como estado local; “Volver” restaura consulta y resultados conservados sin una librería de navegación.
- Mantener separado el estado de búsqueda ingresado y el término enviado. Ante un error de búsqueda, conservar el término enviado y los resultados anteriores; el reintento usa el mismo término.
- Usar un identificador o contador monotónico compartido por operaciones de listado/búsqueda. Solo la solicitud más reciente puede actualizar lista, error o carga. Esto cubre también una carga inicial que termine después de una búsqueda.
- Para detalle, asociar la respuesta con el ID seleccionado o un contador de solicitud. Una respuesta de un ID anterior no puede reemplazar el detalle actual.
- No agregar bearer token ni modificar el estado de autenticación en las dependencias del catálogo.
- Mostrar un error genérico seguro cuando el `HttpClient` no permita distinguir un problema de parseo JSON de un fallo de transporte.

## Orden propuesto de implementación

1. Confirmar los documentos de intención y especificación.
2. Definir el tipo `Product` y el contrato del repositorio en domain.
3. Implementar el datasource con listado, búsqueda y detalle, codificación del query y validación de las respuestas necesarias.
4. Implementar repositorio y casos de uso sin incorporar responsabilidades de autenticación.
5. Crear `productsDependencies.ts` separado de la composición de auth.
6. Implementar estados de presentación para carga, resultados, vacío, error/reintento y detalle; incluir protección ante respuestas obsoletas y preservar resultados/término al fallar búsqueda.
7. Integrar la pantalla dentro de Home conservando saludo y logout.
8. Añadir pruebas unitarias focalizadas y pruebas de regresión para login/logout cuando sean necesarias, sin debilitar pruebas existentes.
9. Ejecutar comandos de verificación configurados y registrar resultados reales, incluidas limitaciones preexistentes.

## Pruebas necesarias

- **Datasource:** rutas de listado/búsqueda/detalle, método GET, query codificado, respuestas válidas, forma/tipos incorrectos, HTTP no exitoso y fallo de red. Probar errores de parseo con la clasificación que actualmente ofrece `HttpClient`; no cambiarlo.
- **Casos de uso/repositorio:** listado, búsqueda no vacía, query vacío, detalle y propagación de errores.
- **Presentación:** carga, resultados, vacío inicial, vacío de búsqueda, error y reintento del listado, error de búsqueda conservando resultados previos y término enviado, y detalle con carga/error/reintento/volver.
- **Respuestas obsoletas:** usar promesas diferidas para comprobar que una respuesta previa de listado/búsqueda no reemplaza los datos/estados de la consulta más reciente y que un detalle tardío de otro producto no reemplaza el producto seleccionado actualmente.
- **Logout/regresión de autenticación:** conservar y ejecutar las pruebas existentes de `AuthContext`, `AuthRepository` y App. Verificar logout accesible desde lista y detalle, logout exitoso mediante el flujo actual y que un fallo no se presente como logout completado. No cambiar ni debilitar aserciones existentes.
- **Aislamiento:** comprobar que las solicitudes de productos no envían bearer token y que errores del catálogo no alteran la sesión.

## Riesgos y limitaciones

- El `HttpClient` actual envuelve ciertos errores de parseo JSON como `HttpError` de estado `0`; no siempre será posible distinguirlos de un fallo de red. Se conserva el cliente y se muestra un mensaje genérico con reintento.
- DummyJSON puede cambiar datos y resultados; las pruebas deben usar respuestas simuladas, no depender de IDs reales disponibles remotamente.
- Los campos que no sean necesarios para la interfaz deben ignorarse u opcionalizarse según el contrato validado.
- La carga de miniaturas puede fallar sin invalidar la consulta del producto.
- El detalle se gestiona con estado local y no ofrece back stack nativo; añadir navegación sería una ampliación del alcance.
