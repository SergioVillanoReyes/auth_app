# Plan: aplicar una estética glassmorphism

## Objetivo y límites

Aplicar un tratamiento visual glassmorphism a las pantallas React Native actuales, conservando la funcionalidad, las responsabilidades por capa y las pruebas existentes.

La propuesta base preserva la paleta y usa transparencia, bordes, reflejos y sombras/elevación de React Native. No añade blur real, dependencias ni configuración nativa. La elección entre esta opción y blur real requiere aprobación antes de guardar el plan como definitivo.

## Estado inspeccionado

| Ruta | Estado |
|---|---|
| `AGENTS.md` | **Inspeccionado/existente.** Define convenciones, límites de arquitectura, restricciones nativas y verificaciones. |
| `ARCHITECTURE.md` | **Inspeccionado/existente.** Identifica `src/core/theme/` para tokens y `src/presentation/` para pantallas/componentes. Su descripción de pantallas está desactualizada respecto del código actual. |
| `App.tsx` | **Inspeccionado/existente.** Proporciona `SafeAreaProvider`, `SafeAreaView` y un contenedor global sin tratamiento visual de fondo. |
| `src/core/theme/index.ts` | **Inspeccionado/existente.** Exporta los módulos actuales de tema. |
| `src/core/theme/colors.ts` | **Inspeccionado/existente.** Define azul y amarillo de marca, fondo amarillo pálido, superficie blanca y colores de texto, borde, éxito y error. |
| `src/core/theme/spacing.ts` | **Inspeccionado/existente.** Proporciona tokens de espaciado. |
| `src/core/theme/radius.ts` | **Inspeccionado/existente.** Proporciona radios compartidos. |
| `src/presentation/screens/LoginScreen/index.tsx` | **Inspeccionado/existente.** Presenta formulario, validación, error y estado de envío usando el hook existente. |
| `src/presentation/screens/AuthLoadingScreen/index.tsx` | **Inspeccionado/existente.** Presenta carga de sesión o error/reintento. |
| `src/presentation/screens/HomeScreen/index.tsx` | **Inspeccionado/existente.** Presenta saludo, error de logout, catálogo y botón de logout. |
| `src/presentation/screens/ProductsCatalogScreen/index.tsx` | **Inspeccionado/existente.** Presenta catálogo, búsqueda, errores, estados vacíos y detalle del producto. |
| `src/presentation/components/AppButton/index.tsx` | **Inspeccionado/existente.** Componente compartido con variantes primary/secondary y estado disabled. |
| `src/presentation/components/SkeletonLoader/` | **Inspeccionado/existente como directorio.** No se confirmó un archivo de componente que deba modificarse; no se propone editarlo en esta etapa. |
| `src/presentation/navigation/AppNavigator.tsx` | **Inspeccionado/existente.** Selecciona pantallas según AuthContext; no contiene estilos visuales que justifiquen su modificación. |
| Pruebas de Login, Home, Products y AuthContext bajo `src/__tests__/presentation/`; `__tests__/App.test.tsx` | **Inspeccionadas/existentes.** Cubren comportamiento funcional; no son pruebas visuales de plataforma. |
| `package.json` | **Inspeccionado/existente.** Declara React Native, Jest, ESLint, TypeScript, `npm test`, `npm run lint`, `npm run android` y `npm run ios`; no se identificó una dependencia dedicada a blur. |
| `tsconfig.json` | **Inspeccionado/existente.** Incluye archivos `.ts`/`.tsx` y excluye `node_modules` y Pods. |

## Rutas nuevas propuestas

| Ruta | Estado y responsabilidad |
|---|---|
| `docs/features/glassmorphism/intent.md` | **Propuesto/nuevo.** Problema, objetivo, alcance, exclusiones y riesgos visuales. |
| `docs/features/glassmorphism/spec.md` | **Propuesto/nuevo.** Contrato visual, comportamiento que debe preservarse y criterios verificables. |
| `docs/features/glassmorphism/plan.md` | **Propuesto/nuevo.** Estado inspeccionado, cambios, orden y verificaciones. |
| `src/core/theme/glass.ts` | **Propuesto/nuevo.** Tokens de superficie translúcida, borde/reflejo y sombra/elevación, definidos solo después de aprobar la opción visual. |

## Archivos existentes que se propone modificar

| Ruta | Cambio propuesto |
|---|---|
| `src/core/theme/index.ts` | Exportar los tokens de vidrio nuevos si se aprueba crear `glass.ts`. |
| `App.tsx` | Aplicar el fondo/capas visuales compartidas detrás de las pantallas React Native. Mantener provider, Safe Area y navegación. |
| `src/presentation/components/AppButton/index.tsx` | Aplicar estilos tipo vidrio coherentes a las variantes y al estado disabled, conservando props, callbacks y accesibilidad. |
| `src/presentation/screens/LoginScreen/index.tsx` | Actualizar estilos de fondo, panel/formulario, inputs y mensajes, manteniendo los estados y el layout funcional. |
| `src/presentation/screens/AuthLoadingScreen/index.tsx` | Actualizar estilos de carga, error y reintento. |
| `src/presentation/screens/HomeScreen/index.tsx` | Aplicar tratamiento visual al encabezado, área de contenido, mensajes y logout sin alterar su lógica. |
| `src/presentation/screens/ProductsCatalogScreen/index.tsx` | Aplicar estilos compartidos al campo de búsqueda, tarjetas, detalle y estados de carga/error/vacío sin cambiar el hook ni su comportamiento. |

No se propone modificar AuthContext, hooks, dominio, datos, endpoints, navegación funcional, dependencias, lockfiles ni archivos nativos.

## Diseño propuesto

- Centralizar los valores visuales compartidos en el tema, reutilizando la paleta, spacing y radius existentes.
- Usar un fondo global con capas de color estáticas para que la transparencia sea perceptible, sin introducir animación ni recursos externos en la primera opción.
- Usar superficies translúcidas con borde claro sutil y sombra/elevación moderadas.
- Mantener textos, indicadores y contenido interior opacos; no aplicar opacidad al contenedor completo si reduce legibilidad.
- Aplicar el tratamiento a estados normales y de error/loading/empty, evitando ocultar mensajes o controles.
- Mantener botones claramente identificables e interactivos en estados normal y disabled.
- No usar blur real en la propuesta base. Si el usuario lo requiere, detener la implementación hasta aprobar dependencia, soporte Android/iOS, cambios nativos permitidos y fallback sin blur.

## Secuencia de implementación propuesta

1. Aprobar si se acepta transparencia visual sin blur, mantener paleta y limitar alcance a UI React Native.
2. Definir los tokens de `glass.ts` y exportarlos desde el tema, sin modificar la lógica funcional.
3. Aplicar el fondo compartido en `App.tsx`.
4. Actualizar `AppButton` y los estilos de AuthLoading/Login.
5. Actualizar Home y las vistas de catálogo/detalle.
6. Ejecutar pruebas de regresión; no cambiar hooks, contratos o aserciones funcionales.
7. Ejecutar lint y TypeScript y revisar cualquier diagnóstico preexistente contra los archivos tocados.
8. Inspeccionar visualmente las pantallas en Android e iOS cuando sea posible y registrar limitaciones.
9. Revisar el diff para asegurar que no incluya cambios funcionales o nativos fuera del alcance aprobado.

## Pruebas y verificación necesarias

- Conservar y ejecutar las pruebas pertinentes de Login, AuthContext, Home, Products y App.
- No modificar las aserciones funcionales existentes para hacer pasar cambios visuales.
- Añadir pruebas solo si se introduce comportamiento nuevo en un componente compartido; la apariencia estática debe verificarse principalmente mediante inspección visual.
- Ejecutar los comandos configurados y documentados: `npm test`, `npm run lint` y `npx tsc --noEmit`.
- Realizar revisión visual manual en Android e iOS: login, carga/error de sesión, Home, catálogo, error/vacío y detalle.
- Confirmar legibilidad, diferenciación de estados y uso consistente del tratamiento visual en diferentes tamaños de pantalla.
- Informar comandos realmente ejecutados y cualquier limitación por plataforma o herramientas.

## Riesgos y decisiones abiertas

- **Blur real:** requiere elegir e introducir una dependencia compatible con React Native y valorar cambios nativos. Alternativa recomendada para primera iteración: superficies translúcidas sin blur.
- **Paleta:** se propone conservar el azul/amarillo existente. Cambiarla amplía el rediseño y requiere aprobación.
- **UI nativa del sistema:** el plan excluye splash y barras del sistema. Si “toda la aplicación” también debe incluirlas, se necesita definir un alcance nativo adicional.
- **Verificación visual:** Jest no puede confirmar por sí solo el aspecto real ni diferencias de renderizado entre Android e iOS.