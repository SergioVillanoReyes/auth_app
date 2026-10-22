# Especificación funcional: catálogo de productos DummyJSON

## Propósito y límites

Esta especificación define el comportamiento observable del catálogo, la búsqueda y el detalle de productos. La funcionalidad se presenta dentro de Home autenticado y conserva el logout existente.

No añade navegación externa, persistencia de productos ni funcionalidades de compra. No cambia el cliente HTTP ni la autenticación.

## Contrato de la API

Según la [documentación de DummyJSON Products](https://dummyjson.com/docs/products):

| Operación | Solicitud | Respuesta esperada |
|---|---|---|
| Listado | `GET https://dummyjson.com/products` | Objeto con una lista `products` y metadatos `total`, `skip` y `limit`. El límite predeterminado documentado es 30. |
| Búsqueda | `GET https://dummyjson.com/products/search?q={query}` | Objeto con una lista `products` y metadatos de resultados. |
| Detalle | `GET https://dummyjson.com/products/{id}` | Objeto de producto individual. |

Los endpoints se consideran públicos. No se envía `Authorization` ni información de sesión para consultarlos.

La primera versión usa el límite predeterminado del endpoint de listado; no implementa paginación.

## Datos usados en la interfaz

El dominio expone solo los campos necesarios para este alcance:

- `id`: identificador numérico del producto;
- `title`: nombre;
- `price`: precio numérico;
- `category`: categoría;
- `description`: descripción;
- `thumbnail`: imagen de vista previa, opcional para la presentación.

La respuesta de red se valida antes de mapearse a este tipo. Se validan la forma del objeto y los tipos de los campos requeridos; los campos no utilizados no necesitan formar parte del modelo de dominio.

## Requisitos funcionales

### Catálogo

1. Al mostrar Home autenticado se solicita `GET /products`.
2. Mientras la solicitud inicial está pendiente, se presenta un indicador o mensaje de carga.
3. La carga no se presenta como una lista vacía.
4. Cada elemento válido muestra como mínimo título y precio; puede mostrar categoría y miniatura si están disponibles.
5. Si el endpoint responde correctamente con una lista vacía, se presenta un estado vacío, no un error.
6. Un fallo de consulta presenta un mensaje comprensible y una acción para volver a intentar el listado.
7. Si el listado inicial sigue pendiente cuando se envía una búsqueda, su respuesta no puede reemplazar los resultados de esa búsqueda posterior.

### Búsqueda

1. La búsqueda se realiza al enviar el formulario; no se aplica debounce.
2. Para un término no vacío se consulta `/products/search?q={query}`.
3. Se codifica el parámetro de búsqueda para que caracteres reservados no alteren la URL.
4. Un término vacío o compuesto solo por espacios vuelve a solicitar la lista general.
5. Se usa el término recortado para decidir si está vacío y como valor enviado en la consulta de búsqueda.
6. Mientras se ejecuta una búsqueda, se comunica que los resultados se están actualizando.
7. Una respuesta válida sin coincidencias presenta un estado vacío de búsqueda.
8. Si una búsqueda nueva se envía antes de que termine otra solicitud de listado o búsqueda, solo se aplican los resultados de la solicitud más reciente.
9. Si una búsqueda falla después de que ya se hayan mostrado resultados correctos, se conservan esos resultados anteriores y se mantiene visible el término enviado. Se muestra el error y se permite reintentar ese mismo término sin perder resultados ni contexto.
10. Un error de búsqueda sin resultados previos se muestra con una acción para reintentar la consulta, conservando el término enviado.
11. Una respuesta obsoleta de una búsqueda no puede reemplazar los resultados ni limpiar el error/estado de carga asociado a una búsqueda posterior.

### Detalle

1. Seleccionar un producto solicita `GET /products/{id}`.
2. Mientras se obtiene el detalle, se presenta un estado de carga.
3. El detalle muestra título, precio, categoría y descripción cuando la respuesta es válida.
4. La respuesta individual se valida antes de presentarse.
5. Si la consulta falla o el producto no existe, se muestra un error comprensible y se permite reintentar o regresar al catálogo.
6. Al regresar a la lista se conservan el término de búsqueda y los resultados que estaban visibles, mientras el estado de la pantalla siga montado.
7. Si el usuario selecciona otro producto mientras una consulta de detalle anterior continúa pendiente, solo se aplica el resultado del producto actualmente seleccionado.
8. Una respuesta obsoleta de detalle no puede reemplazar el detalle actual ni alterar el estado de carga/error del producto seleccionado más recientemente.
9. El detalle se representa dentro del flujo de presentación existente; no se incorpora una librería de navegación.

### Logout y autenticación existente

1. La acción de logout sigue disponible desde el catálogo y desde el detalle.
2. El logout usa el flujo existente y elimina la sesión local antes de pasar a Login.
3. Un fallo de logout conserva el comportamiento de error actual; el catálogo no declara que la sesión se cerró.
4. Las solicitudes y errores del catálogo no cambian tokens, almacenamiento de sesión ni estado de autenticación.
5. El catálogo no agrega headers de autenticación a los endpoints públicos de productos.

## Estados de interfaz

- **Carga inicial del catálogo:** indicador visible mientras se obtiene el listado.
- **Resultados del catálogo:** lista validada de productos.
- **Carga de búsqueda:** indicador o mensaje mientras se consulta el término enviado.
- **Resultados de búsqueda:** productos de la solicitud más reciente.
- **Error de búsqueda con resultados previos:** se conservan y muestran los resultados previos y el término enviado; el error y el reintento no borran ese contexto.
- **Vacío inicial:** mensaje si el listado válido no contiene productos.
- **Vacío de búsqueda:** mensaje diferenciado si la búsqueda válida no tiene coincidencias.
- **Error de catálogo/búsqueda:** mensaje comprensible y reintento de la operación que falló.
- **Carga del detalle:** indicador durante la consulta del producto seleccionado.
- **Error de detalle:** mensaje con acciones para reintentar o regresar.
- **Error de imagen:** no invalida el listado ni el detalle; la interfaz permanece utilizable.

Los estados de carga/error de una consulta obsoleta no pueden reemplazar el estado vigente de la consulta más reciente.

## Manejo de errores y respuestas

1. Se usa el `HttpClient` existente sin modificarlo.
2. Los estados HTTP no exitosos se manejan usando `HttpError` y la información disponible en el cliente actual.
3. El cliente actual convierte ciertos errores de red y errores al analizar JSON en `HttpError` con estado `0`. Por esa limitación, la interfaz puede presentar un mensaje genérico de consulta fallida en lugar de asegurar que ocurrió específicamente un fallo de red.
4. Una respuesta JSON sintácticamente válida pero con estructura incompatible se trata como respuesta inválida; no se presenta como catálogo/producto válido ni como respuesta vacía.
5. Los errores permiten reintentar sin cerrar sesión ni modificar el estado autenticado.
6. No se presentan cuerpos completos de respuesta ni detalles internos en la interfaz o en logs.
7. El error de una solicitud obsoleta no modifica los resultados o estados de una solicitud posterior.

## Criterios de aceptación

- **CAT-01:** al entrar en Home autenticado se realiza una solicitud a `/products` y se muestran productos válidos.
- **CAT-02:** durante la carga inicial se muestra un estado de carga, sin confundirlo con resultados vacíos.
- **CAT-03:** los elementos del listado muestran al menos título y precio.
- **CAT-04:** enviar una búsqueda no vacía consulta `/products/search` con el query correctamente codificado.
- **CAT-05:** enviar un query vacío o compuesto solo por espacios solicita el listado general.
- **CAT-06:** una respuesta válida sin productos muestra el estado vacío apropiado y no el estado de error.
- **CAT-07:** ante un error de listado se informa del problema y reintentar vuelve a ejecutar el listado.
- **CAT-08:** ante un error de búsqueda se conservan los resultados previos y el término enviado, se muestra el error y el reintento repite esa búsqueda.
- **CAT-09:** si un listado o búsqueda anterior termina después de una consulta posterior, no sobrescribe resultados, error o estado de carga de la consulta más reciente.
- **CAT-10:** seleccionar un producto consulta `/products/{id}` y muestra sus campos requeridos tras validarlos.
- **CAT-11:** mientras se obtiene el detalle se muestra carga; ante un error se puede reintentar o volver al catálogo.
- **CAT-12:** al seleccionar productos sucesivamente, una respuesta tardía de un producto anterior no reemplaza el detalle del producto seleccionado más recientemente.
- **CAT-13:** regresar del detalle conserva el término y los resultados visibles si la pantalla no se desmontó.
- **CAT-14:** el logout continúa accesible en catálogo y detalle, y conserva el comportamiento actual.
- **CAT-15:** las consultas de productos no envían ni modifican tokens de sesión.
- **CAT-16:** las pruebas existentes de login/logout siguen pasando sin cambiar sus aserciones para ocultar regresiones.
