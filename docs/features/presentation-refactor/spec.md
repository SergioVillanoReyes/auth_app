# Especificación: refactorización de lógica de presentación en hooks

## Propósito y límites

Esta especificación define los comportamientos que deben conservarse al extraer lógica local de Login y Products a hooks de React. La refactorización no añade funcionalidad de usuario ni cambia los contratos de autenticación, catálogo o navegación.

Los documentos existentes de Login y Products siguen siendo las fuentes del comportamiento funcional original. Esta especificación los complementa para la refactorización; no los sustituye.

## Requisitos

### REF-01: límites de responsabilidad

1. La lógica local de presentación que se extraiga residirá en hooks bajo `src/presentation/hooks/`.
2. Los hooks podrán administrar estado e interacciones de presentación y coordinar llamadas a las abstracciones existentes.
3. Los hooks no implementarán reglas de autenticación, persistencia, HTTP, mapeo de respuestas ni lógica de repositorio.
4. El dominio no importará React, React Native ni presentation.
5. No se crearán capas, contextos globales ni dependencias nuevas para esta refactorización.

### REF-02: Login

1. El formulario seguirá mostrando y controlando los campos de usuario y contraseña.
2. La validación local seguirá rechazando valores vacíos o compuestos solo por espacios antes de invocar `login`.
3. Las credenciales admisibles se enviarán como están escritas, sin transformación silenciosa.
4. El estado de envío, el error de validación, el error comunicado por AuthContext y la habilitación de los campos conservarán el comportamiento actual.
5. El hook delegará el login en `useAuth`; no llamará directamente a casos de uso, repositorios, datasources ni almacenamiento.
6. El hook no duplicará el control de concurrencia, la validación de seguridad ni el mapeo de errores que pertenecen a AuthContext.
7. Un error de login o una validación fallida no limpiará automáticamente los valores del formulario.

### REF-03: Products

1. La carga inicial del catálogo seguirá comenzando cuando se monte la pantalla.
2. El envío de búsqueda seguirá usando el término recortado para la consulta y conservando el texto introducido como valor visible del campo.
3. Las cargas, errores, resultados vacíos y acciones de reintento mantendrán el comportamiento funcional actual.
4. Si una búsqueda falla después de mostrar resultados, se conservarán esos resultados, el término enviado y la posibilidad de reintentar la misma búsqueda.
5. El detalle seguirá mostrando carga, error con reintento y una acción para volver al catálogo.
6. Volver del detalle conservará el término de búsqueda y los resultados mientras la pantalla siga montada.
7. Se mantendrán las protecciones actuales contra respuestas obsoletas para listado/búsqueda y detalle, incluida la invalidación de solicitudes al volver al catálogo y al desmontar la pantalla.
8. El fallo de una imagen seguirá sin invalidar el catálogo ni el detalle.
9. El hook usará los casos de uso y la composición de productos existentes; no implementará directamente HTTP ni reglas de negocio.

### REF-04: pantallas que no requieren hook

1. Home seguirá mostrando el saludo, el catálogo y el logout disponibles.
2. La acción y el estado global de logout seguirán perteneciendo a AuthContext.
3. AuthLoadingScreen seguirá siendo una vista controlada por props.
4. AppNavigator seguirá seleccionando la pantalla de acuerdo con el estado de autenticación.
5. No se añadirá un hook a estas piezas sin una justificación específica y aprobación de alcance.

### REF-05: compatibilidad y alcance

1. Los cambios conservarán el comportamiento observable y los contratos actuales de los componentes y la navegación.
2. No se modificarán los documentos existentes de Login ni Products.
3. No se cambiarán aserciones existentes para hacer pasar la refactorización.
4. No se cambiarán autenticación, tokens, almacenamiento nativo, API, cliente HTTP, dependencias ni configuración de plataformas.
5. La refactorización no incorporará cambios visuales, nuevos estados de usuario ni nuevas funcionalidades.

## Criterios de aceptación verificables

- **REF-AC-01:** Login usa un hook de presentación para su estado e interacción local, mientras que el componente sigue siendo responsable del renderizado.
- **REF-AC-02:** las pruebas comprueban que usuario o contraseña vacíos o compuestos solo por espacios no invocan `login`.
- **REF-AC-03:** las pruebas comprueban que una entrada válida delega las credenciales introducidas sin transformarlas y que los valores se conservan ante error.
- **REF-AC-04:** durante el envío se mantiene el estado de carga, los campos siguen deshabilitados y el feedback de AuthContext continúa visible.
- **REF-AC-05:** Products usa un hook de presentación para su estado e interacciones locales, sin cambiar la composición visual ni el comportamiento observable.
- **REF-AC-06:** las pruebas existentes de Products siguen comprobando carga inicial, búsqueda, conservación de resultados y término ante fallo, reintento, detalle y respuestas obsoletas.
- **REF-AC-07:** las respuestas de detalle que dejan de corresponder a la selección actual no cambian el detalle visible; volver al catálogo invalida la solicitud de detalle pendiente.
- **REF-AC-08:** Home mantiene el logout disponible en catálogo y detalle; los errores del catálogo no alteran el estado de autenticación.
- **REF-AC-09:** la refactorización no requiere cambios funcionales en AuthContext, AppNavigator, domain, data o dependencias.
- **REF-AC-10:** pasan las pruebas pertinentes, lint y la verificación TypeScript disponible, o se informa cada limitación junto al comando exacto y su resultado observado.
- **REF-AC-11:** el diff contiene únicamente cambios directamente relacionados con los hooks, las pantallas y sus pruebas.

## Estados y errores que deben preservarse

La refactorización no introduce estados nuevos. Deben conservarse los estados existentes:

- **Login:** formulario, validación local, envío, éxito mediado por AuthContext y errores de login.
- **Products:** carga inicial, resultados, carga de búsqueda, vacío, error con reintento, detalle, carga/error de detalle, regreso al catálogo y fallo de imagen.
- **Autenticación:** inicialización, error recuperable, estado anónimo y estado autenticado, gestionados por AuthContext y AppNavigator.

## Verificación

La configuración inspeccionada de `package.json` ofrece `npm test` y `npm run lint`. `AGENTS.md` documenta `npx tsc --noEmit` y especifica que no hay un script `typecheck`. Esta especificación no afirma que dichos comandos se hayan ejecutado.