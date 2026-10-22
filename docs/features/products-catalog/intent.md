# Intención: catálogo de productos DummyJSON

## Problema

La aplicación ya cuenta con autenticación y una pantalla Home, pero Home todavía no ofrece una función para explorar contenido. Se busca añadir una experiencia pequeña que permita practicar el consumo de una API REST y la arquitectura por capas sin ampliar ni alterar el flujo de autenticación.

## Objetivo

Permitir que una persona autenticada consulte productos de DummyJSON, busque productos por nombre y abra el detalle de un producto.

## Motivación

Esta funcionalidad permite practicar:

- consumo de endpoints REST existentes;
- validación y mapeo de respuestas externas a tipos propios;
- separación entre domain, data y presentation;
- estados de carga, error y resultados vacíos;
- pruebas unitarias independientes de la red real;
- integración con Home conservando el logout actual.

## Alcance inicial

- Cargar una lista de productos desde `GET /products`.
- Buscar productos por texto usando `GET /products/search?q={query}` al enviar el formulario.
- Consultar el detalle de un producto con `GET /products/{id}` al seleccionarlo.
- Mostrar estados de carga, error con reintento y resultados vacíos.
- Evitar que respuestas obsoletas de listado, búsqueda o detalle reemplacen los resultados de la operación más reciente o del producto actualmente seleccionado.
- Mantener disponible la acción de logout tanto desde el catálogo como desde el detalle.
- Reutilizar el cliente HTTP, la arquitectura por capas y las dependencias existentes cuando sea posible.
- No enviar ni modificar tokens de autenticación para consultar los endpoints públicos de productos.

## Exclusiones

Esta etapa no incluye:

- carrito, compras, pagos, favoritos ni reseñas;
- creación, edición o eliminación de productos;
- filtros por categoría, ordenamiento o paginación;
- persistencia local o caché de productos;
- cambios al login, renovación, almacenamiento de sesión o contrato de logout;
- librerías nuevas de navegación;
- dependencias nuevas;
- cambios a `HttpClient.ts`;
- rediseño general de Home más allá de lo necesario para alojar el catálogo y el detalle.

## Resultado esperado

Al entrar en Home con sesión autenticada, la persona ve productos obtenidos de DummyJSON. Puede enviar una búsqueda por nombre, ver resultados o un estado vacío y seleccionar un producto para consultar su detalle.

Si la red o el servicio falla, la aplicación comunica el problema y permite reintentar. Si falla una búsqueda después de que ya se hayan mostrado productos, conserva esos productos y el término enviado para que el usuario pueda reintentar sin perder el contexto. Los errores del catálogo no modifican el estado de autenticación ni impiden cerrar sesión.

## Riesgos conocidos

- DummyJSON es un servicio externo; puede no responder o devolver errores HTTP.
- El conjunto de datos puede cambiar y no debe asumirse que un producto específico estará siempre disponible.
- Las respuestas deben validarse antes de presentarse como un catálogo o producto válido.
- El cliente HTTP actual puede clasificar ciertos errores de análisis JSON como error de transporte con estado `0`; en esta etapa el mensaje podría ser genérico y no distinguir con precisión JSON inválido de algunos errores de red.
- La carga de una imagen remota puede fallar independientemente de la consulta de productos y no debe inutilizar el catálogo.
