# Intención: aplicar una estética glassmorphism a la aplicación

## Problema

La interfaz actual utiliza superficies mayormente opacas y estilos definidos en cada pantalla. Login, estados de autenticación, Home y catálogo/detalle no comparten todavía un lenguaje visual de superficies translúcidas.

Se busca aplicar una estética coherente de glassmorphism en la interfaz de la aplicación sin alterar las funciones de autenticación, catálogo, búsqueda, detalle o navegación.

## Usuario y valor

El cambio beneficia a quienes usan la aplicación al ofrecer una presentación visual más consistente y distintiva. También facilita el mantenimiento visual al centralizar los tokens que comparten pantallas y componentes.

## Objetivo

Aplicar una apariencia de glassmorphism consistente a todas las pantallas gestionadas por React Native, conservando los colores de marca actuales y sin modificar el comportamiento funcional.

## Alcance propuesto

- Aplicar el lenguaje visual a Login, estados de inicialización/error de autenticación, Home y las vistas de catálogo y detalle.
- Definir tokens reutilizables de tema para fondo, superficies translúcidas, bordes, reflejos, sombras y radios, según lo permita la implementación aprobada.
- Actualizar los estilos de los elementos visuales compartidos, en particular los botones, además de los campos, paneles, tarjetas y estados de interfaz que existan en las pantallas.
- Mantener legibles los textos y controles; aplicar transparencia a las superficies, no a su contenido completo.
- Conservar los colores actuales de marca —azul y amarillo— salvo que se apruebe expresamente un cambio de paleta.
- Mantener intactos los flujos de login/logout, autenticación, carga del catálogo, búsqueda, detalle, errores y reintentos.
- Verificar visualmente los estados principales y regresionar las pruebas automatizadas existentes.

La propuesta inicial consigue una apariencia inspirada en vidrio mediante capas translúcidas, bordes y sombras nativos de React Native; no presupone desenfoque real del fondo ni nuevas dependencias.

## Exclusiones

Esta etapa no incluye:

- cambios funcionales, navegación nueva ni alteraciones a los hooks, contextos, casos de uso o datos;
- cambios en autenticación, tokens, persistencia o llamadas de red;
- cambios en la paleta de marca salvo autorización expresa;
- incorporación de librerías de blur, gradientes, animación o iconografía;
- cambios a configuración nativa, splash, status bar o navegación del sistema;
- rediseño de contenido, cambios de textos o nuevos componentes funcionales;
- cambios a documentos existentes de Login, Products o presentación-refactor.

## Riesgos

- Una superficie demasiado opaca puede no comunicar el efecto esperado; una demasiado transparente puede reducir legibilidad.
- Sombras, transparencia y elevación pueden representarse de forma distinta en Android e iOS.
- La ausencia de blur real puede no cumplir la expectativa si “glassmorphism” significa necesariamente desenfoque de fondo.
- Aplicar el efecto de forma aislada, sin un fondo visible a través de las superficies, puede hacer que la transparencia apenas se note.
- Cambios visuales en botones, campos o tarjetas podrían reducir contraste, accesibilidad o claridad de estados disabled/error.
- Un cambio amplio de estilos puede introducir regresiones visuales aun si las pruebas funcionales siguen pasando.

## Resultado esperado

Todas las pantallas React Native comparten un lenguaje visual de superficies tipo vidrio, con contenido y controles legibles. Los flujos funcionales existentes se mantienen sin cambios.

## Decisiones pendientes

Antes de guardar esta intención como aprobada, confirmar:

1. Si se acepta el efecto de vidrio simulado sin blur real o si se requiere desenfoque real y, por tanto, evaluar una dependencia y sus implicaciones nativas.
2. Si se conserva la paleta actual de azul/amarillo.
3. Si el alcance se limita a las pantallas React Native, excluyendo splash nativo y barras del sistema.