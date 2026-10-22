# Intención: refactorización de lógica de presentación en hooks

## Problema actual

Algunas pantallas concentran en el mismo archivo la interfaz, el estado local y las interacciones que controlan su comportamiento. En particular, Login combina la presentación del formulario con su estado, validación y envío; Products combina la presentación del catálogo y el detalle con solicitudes asíncronas, estados de carga/error y control de respuestas obsoletas.

Esta mezcla dificulta leer y mantener las pantallas, así como probar su lógica de interacción de forma aislada. El propósito no es cambiar lo que la aplicación hace, sino delimitar mejor responsabilidades dentro de la capa de presentación.

## Usuario y valor

El cambio beneficia a quienes desarrollan y mantienen `auth_app`: facilita comprender la interfaz de cada pantalla, localizar la lógica de estado e interacción y probarla sin alterar el comportamiento observable de la aplicación.

## Objetivo

Separar mediante custom hooks de React la lógica local de estado e interacción de las pantallas que lo justifiquen, manteniendo intactos el comportamiento funcional, los contratos entre capas y la arquitectura existente.

## Alcance

- Extraer a un hook la lógica local del formulario de Login: valores, validación, error local y envío delegado a `useAuth`.
- Extraer a un hook la lógica local de catálogo y detalle de Products: estado de consultas, búsqueda, selección, reintentos, fallos de imagen y protección ante respuestas obsoletas.
- Mantener las pantallas como componentes de presentación que conectan valores y acciones del hook con los elementos visuales existentes.
- Mantener el estado global de autenticación, la persistencia de sesión y las operaciones de login/logout en sus abstracciones actuales.
- Mantener las operaciones de productos y sus contratos en los casos de uso, repositorios y datasources existentes.
- Realizar el cambio incrementalmente, una pantalla por etapa, preservando las pruebas existentes y agregando las necesarias.

## Exclusiones

Esta refactorización no incluye:

- cambios en login, logout, restauración de sesión o manejo de tokens;
- cambios en catálogo, búsqueda, detalle, estados de carga/error/vacío o reintentos;
- modificaciones de AuthContext, AppNavigator, casos de uso, repositorios, datasources, modelos o cliente HTTP;
- extracción de hooks para Home o AuthLoadingScreen, salvo que una necesidad concreta sea aprobada posteriormente;
- nuevas capas, contextos globales, dependencias o librerías de navegación;
- rediseño de interfaces, cambios de textos o estilos, ni nuevos flujos de usuario;
- sobrescribir o combinar esta documentación con los documentos existentes de Login o Products.

## Riesgos

- Una extracción incorrecta puede cambiar cuándo se inicia una consulta, cómo se conserva el formulario o cómo se muestran errores.
- Las solicitudes tardías de listado, búsqueda o detalle podrían actualizar un estado que ya no corresponde a la vista actual si no se preservan las invalidaciones existentes.
- La lógica de autenticación podría duplicarse accidentalmente entre el hook de Login y AuthContext.
- Cambiar dependencias o limpieza de efectos puede alterar el comportamiento al montar o desmontar la pantalla.
- La pantalla Login no cuenta actualmente con una prueba directa identificada, lo que aumenta el riesgo de regresión durante su extracción.

## Resultado esperado

Login y Products conservan el mismo comportamiento observable, con la lógica local agrupada en hooks de presentación. Home, AuthLoadingScreen, AuthContext, navegación, dominio y datos permanecen sin cambios funcionales.