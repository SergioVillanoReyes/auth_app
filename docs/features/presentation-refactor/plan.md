# Plan: refactorización de lógica de presentación en hooks

## Objetivo y límites

Extraer la lógica local de Login y Products a hooks de presentación en dos etapas independientes. Mantener el comportamiento, los límites arquitectónicos y las pruebas actuales.

No se propone modificar AuthContext, AppNavigator, Home, AuthLoadingScreen, domain, data, dependencias, configuración nativa ni los documentos previos de Login y Products.

## Estado inspeccionado

| Ruta | Estado y hecho comprobado |
|---|---|
| `AGENTS.md` | Inspeccionado. Define arquitectura, convenciones y criterios de pruebas. |
| `ARCHITECTURE.md` | Inspeccionado. Documenta `src/presentation/hooks/`; su descripción de pantallas es anterior a la estructura actual. |
| `docs/features/login/intent.md` | Inspeccionado como contexto de comportamiento de autenticación. |
| `docs/features/login/spec.md` | Inspeccionado como contexto de requisitos de login, sesión y logout. |
| `docs/features/login/plan.md` | Inspeccionado como contexto de la implementación anterior. |
| `docs/features/login/REVIEW.md` | Inspeccionado como contexto de regresiones que deben protegerse. |
| `docs/features/login/decisions.md` y `docs/features/login/evals.md` | Rutas existentes, sin contenido. |
| `docs/features/products-catalog/intent.md` | Inspeccionado como contexto de alcance del catálogo. |
| `docs/features/products-catalog/spec.md` | Inspeccionado como fuente de comportamiento de catálogo y detalle. |
| `docs/features/products-catalog/plan.md` | Inspeccionado como contexto de responsabilidades y pruebas del módulo. |
| `src/presentation/screens/LoginScreen/index.tsx` | Existe. Contiene inputs, estado local de usuario/contraseña/validación y envío a `useAuth`. |
| `src/presentation/screens/ProductsCatalogScreen/index.tsx` | Existe. Contiene estado de catálogo, búsqueda, detalle, reintentos, imágenes y protección contra respuestas obsoletas. |
| `src/presentation/screens/HomeScreen/index.tsx` | Existe. Muestra saludo y logout y aloja Products. No tiene estado local relevante que justifique un hook. |
| `src/presentation/screens/AuthLoadingScreen/index.tsx` | Existe. Renderiza carga/error y reintento mediante props; no contiene estado propio. |
| `src/presentation/navigation/AppNavigator.tsx` | Existe. Selecciona pantallas según el estado de AuthContext. |
| `src/presentation/context/AuthContext.tsx` | Existe. Mantiene estado global y acciones de autenticación; no se propone trasladar esa lógica a hooks de pantalla. |
| `src/presentation/hooks/` | Directorio existente y vacío; destino propuesto para los hooks. |
| `src/__tests__/presentation/context/AuthContext.test.tsx` | Existe. Cubre restauración, login/logout y error de logout. |
| `src/__tests__/presentation/screens/HomeScreen.test.tsx` | Existe. Comprueba integración del catálogo y disponibilidad del logout. |
| `src/__tests__/presentation/screens/ProductsCatalogScreen.test.tsx` | Existe. Cubre carga, búsqueda, errores, reintentos, detalle y respuestas tardías. |
| `src/__tests__/presentation/screens/LoginScreen.test.tsx` | No existe en la estructura inspeccionada. |
| `src/__tests__/presentation/hooks/` | No existe en la estructura inspeccionada. |
| `package.json` | Inspeccionado. Declara `npm test` y `npm run lint`; no declara un script `typecheck`. |
| `tsconfig.json` y `jest.config.js` | Existen en el repositorio. Jest está configurado para React Native. No se ejecutaron comandos durante la planificación. |

## Protecciones de Products que deben conservarse

La implementación actual de `ProductsCatalogScreen` utiliza dos contadores de solicitudes:

- `listRequestId` aumenta cuando comienza una carga o búsqueda. Solo la solicitud cuyo identificador siga siendo el más reciente puede actualizar resultados, error o estado de carga.
- `detailRequestId` aumenta cuando comienza una consulta de detalle. Solo la solicitud vigente puede actualizar el producto seleccionado, su error o su carga.
- Volver al catálogo incrementa `detailRequestId`, con lo que una respuesta de detalle pendiente deja de ser vigente.
- La limpieza del efecto de montaje incrementa ambos contadores, invalidando solicitudes pendientes cuando la pantalla se desmonta.

El hook debe conservar estos contadores y sus comprobaciones antes de actualizar el estado. La limpieza debe seguir asociada al ciclo de vida de la pantalla mediante el efecto correspondiente. No se propone agregar cancelación de red: la implementación actual descarta las respuestas tardías mediante invalidación.

## Cobertura existente y pruebas propuestas

La prueba `src/__tests__/presentation/screens/ProductsCatalogScreen.test.tsx` ya verifica:

- que una búsqueda posterior no sea reemplazada por una búsqueda anterior que termine más tarde;
- que la respuesta tardía de la carga inicial no reemplace una búsqueda posterior;
- que un detalle anterior no reemplace el producto elegido después de volver al catálogo;
- que un error de búsqueda conserve resultados y término, y permita reintentar ese mismo término.

Estas pruebas deben conservarse y seguir probando el comportamiento a través de la pantalla después de extraer el hook. No se propone duplicarlas en una suite nueva de hooks.

El efecto actual invalida las solicitudes al desmontarse, pero no se identificó una prueba que verifique directamente ese caso. Como el resultado de resolver una promesa después del desmontaje no tiene una aserción observable fiable en las pruebas actuales, no se propone añadir una prueba artificial. Durante la extracción se conservará y revisará explícitamente la limpieza del efecto.

## Rutas nuevas propuestas

| Ruta propuesta | Responsabilidad |
|---|---|
| `docs/features/presentation-refactor/intent.md` | Documentar problema, objetivo, alcance, exclusiones y riesgos. |
| `docs/features/presentation-refactor/spec.md` | Documentar comportamientos que deben conservarse y criterios verificables. |
| `docs/features/presentation-refactor/plan.md` | Registrar estado inspeccionado, responsabilidades, secuencia y pruebas. |
| `src/presentation/hooks/useLoginForm.ts` | Administrar estado local del formulario, validación y envío delegado mediante `useAuth`. |
| `src/presentation/hooks/useProductsCatalog.ts` | Administrar cohesivamente el estado e interacciones de catálogo, búsqueda y detalle, usando los casos de uso existentes y preservando la invalidación de solicitudes. |
| `src/__tests__/presentation/screens/LoginScreen.test.tsx` | Añadir pruebas de comportamiento observable del formulario Login, que no cuenta actualmente con prueba directa identificada. |

No se propone crear `src/__tests__/presentation/hooks/`: las pruebas actuales de Products ya cubren los comportamientos de concurrencia observables desde la pantalla.

## Archivos existentes propuestos para modificar

| Ruta | Cambio propuesto |
|---|---|
| `src/presentation/screens/LoginScreen/index.tsx` | Reemplazar estado y handlers locales por valores y acciones de `useLoginForm`; conservar estructura visual y estados actuales. |
| `src/presentation/screens/ProductsCatalogScreen/index.tsx` | Delegar estado e interacciones locales en `useProductsCatalog`; conservar el render de catálogo, búsqueda, detalle y sus estados. |
| `src/__tests__/presentation/screens/ProductsCatalogScreen.test.tsx` | Ajustar solo importaciones o mocks internos si es necesario. Mantener las aserciones de comportamiento existentes. |

No se propone modificar AuthContext, AppNavigator, HomeScreen, AuthLoadingScreen, casos de uso, contratos de dominio, repositorios, datasources, `HttpClient`, documentos previos, configuración, dependencias ni pruebas de autenticación existentes.

## Cohesión de `useProductsCatalog`

Se propone un solo hook. Catálogo, búsqueda y detalle pertenecen a la misma pantalla y comparten productos, término enviado, selección, acción de volver y las reglas que determinan qué respuesta puede actualizar la vista. Dividirlos en varios hooks repartiría o exigiría coordinar estado y contadores que actualmente se manejan juntos; el código inspeccionado no muestra una razón suficiente para hacerlo.

El hook coordinará la presentación y delegará las operaciones en los casos de uso existentes. No reemplazará esos casos de uso ni realizará HTTP. `ProductsCatalogScreen` seguirá siendo responsable de representar la interfaz y los estilos.

## Secuencia incremental

1. Confirmar el plan final antes de implementar.
2. Añadir `useLoginForm` y extraer únicamente la lógica local del formulario.
3. Crear pruebas de Login para validación, delegación de credenciales, carga, errores y conservación de valores.
4. Ejecutar las pruebas focalizadas de Login y revisar el cambio antes de abordar Products.
5. Añadir `useProductsCatalog` y extraer el estado e interacciones locales de la pantalla.
6. Preservar en el hook los contadores de listado/búsqueda y detalle, sus comprobaciones antes de actualizar estado, la invalidación al volver al catálogo y la limpieza al desmontar.
7. Mantener las pruebas actuales de Products. Ajustar detalles internos solo si la extracción lo requiere, sin eliminar ni debilitar aserciones.
8. Ejecutar pruebas de Products y pruebas de regresión de Home y AuthContext para comprobar que catálogo y logout siguen integrados.
9. Revisar el diff para confirmar que solo incluye hooks, pantallas y pruebas directamente relacionadas.

## Pruebas necesarias

### Login: cobertura nueva propuesta

- Campos vacíos o con solo espacios: no invocan login y muestran validación.
- Entrada válida: delega a `useAuth` las credenciales introducidas sin transformarlas.
- Error de validación o de login: muestra el feedback correspondiente y conserva los valores.
- Envío en curso: mantiene el estado de carga y deshabilita los campos como actualmente.

### Products: cobertura existente que se conserva

- Carga inicial y presentación de resultados.
- Fallo de búsqueda con conservación de resultados y término, seguido de reintento.
- Ignorar una búsqueda antigua que termina después de una búsqueda nueva.
- Ignorar la carga inicial si termina después de una búsqueda.
- Ignorar un detalle antiguo tras volver al catálogo y seleccionar otro producto.
- Reintentar un error de detalle y mostrar el estado vacío para una búsqueda sin coincidencias.

No se añade una segunda prueba de concurrencia para los casos que ya cubre `ProductsCatalogScreen.test.tsx`.

### Regresión

Ejecutar las pruebas existentes de `HomeScreen.test.tsx` y `AuthContext.test.tsx`, además de las pruebas pertinentes de App, para comprobar que logout, autenticación y estado global no cambian.

No se cambiarán ni eliminarán aserciones para ocultar regresiones.

## Verificaciones disponibles

- `npm test`: script declarado en `package.json`.
- `npm run lint`: script declarado en `package.json`.
- `npx tsc --noEmit`: comando documentado en `AGENTS.md`; `package.json` no define un script `typecheck`.

Al implementar, registrar exactamente qué comandos se ejecutaron y sus resultados. Este plan no afirma que se haya ejecutado ninguna verificación.