# Contexto para agentes de IA

## Stack y tecnologías

- Aplicación móvil con React Native 0.86, React 19 y TypeScript.
- Node.js requerido: `>= 22.11.0`.
- Android usa Kotlin y Gradle; iOS usa Swift, Objective-C para el puente nativo y CocoaPods.
- La aplicación parte de una pantalla de inicio mínima. Las pruebas usan Jest y `react-test-renderer`.

## Arquitectura y dependencias entre capas

- `src/domain` reserva espacio para entidades, contratos de repositorio y casos de uso; debe mantenerse independiente de `data` y `presentation`.
- `src/data` reserva espacio para acceso HTTP, modelos, repositorios, caché y almacenamiento.
- `src/presentation` contiene pantallas, componentes y navegación; se pueden agregar hooks y contextos según las funciones futuras.
- Mantén las dependencias entre capas explícitas y coloca la composición en `src/core/di` cuando se agreguen funciones.
- `src/core/theme` concentra los tokens de estilos.
- Antes de implementar una tarea, inspecciona el código y la documentación relevante. Si la documentación contradice el código, verifica primero la implementación actual.

## Convenciones de código y alcance

- Sigue ESLint y Prettier del repositorio: indentación de dos espacios, comillas simples en JS/TS, comillas dobles en JSX y sin `any` explícito.
- Mantén el estilo existente en los archivos que modifiques y conserva los tipos de TypeScript.
- Mantén el trabajo dentro del alcance solicitado. No hagas refactors no relacionados con la tarea.
- No introduzcas nuevas librerías, patrones arquitectónicos ni abstracciones si la arquitectura existente puede resolver la tarea.
- Si detectas problemas existentes fuera del alcance, repórtalos, pero no los corrijas automáticamente.

## Comandos de validación

- Tests: `npm test`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit` (no hay script de typecheck en `package.json`).
- Metro: `npm start`
- Android: `npm run android`
- iOS: `npm run ios` (requiere macOS/Xcode).
- La configuración TypeScript incluye archivos `.ts` y `.tsx` de forma amplia. Distingue el código fuente de artefactos generados al revisar errores, especialmente bajo carpetas `build`.

## Convenciones de testing

- Jest usa el preset de React Native y Babel (`jest.config.js`).
- Los tests se nombran `*.test.ts` o `*.test.tsx`; los de capas se organizan bajo `src/__tests__` por capa y los tests raíz bajo `__tests__`.
- Aísla dependencias con mocks tipados a partir de interfaces; limpia mocks en `beforeEach`.
- Comprueba resultados, llamadas relevantes y propagación de errores.
- No modifiques tests únicamente para hacer que una implementación pase; actualiza o añade pruebas cuando corresponda al comportamiento solicitado.

## Restricciones importantes

- No cambies dependencias, versiones de plataforma, contratos compartidos o configuración nativa si la tarea no lo requiere.
- No alteres la integración RASP/Talsec, la lógica de respuesta ante amenazas ni los hashes/certificados sin autorización expresa.
- No cambies firma de Android, identificadores de aplicación, permisos, configuración de privacidad ni credenciales/certificados salvo que la tarea lo solicite explícitamente.
- No edites ni incluyas artefactos de build como si fueran código fuente.
- No modifiques tests únicamente para ocultar una regresión o ajustar expectativas a una implementación incorrecta.

## Reglas específicas de Android/iOS

- El módulo nativo compartido se llama `StorageModule` y expone `getItem` y `setItem`. Las implementaciones nativas permanecen disponibles, aunque actualmente no hay un adaptador JavaScript conectado.
- Android implementa el almacenamiento con `EncryptedSharedPreferences`; `StoragePackage` debe permanecer registrado en `MainApplication.kt` para exponer el módulo.
- La integración iOS de almacenamiento está en `StorageModule.swift` y su puente en `ios/auth_app/StorageModuleBridge.m`. Coordina los cambios de interfaz en ambos archivos.
- iOS usa `UserDefaults`; no asumas que su nivel de protección es equivalente al almacenamiento cifrado de Android.
- `ios/auth_app/PrivacyInfo.xcprivacy` declara APIs accedidas y forma parte de los recursos de la aplicación. Tenla en cuenta si un cambio afecta el uso de APIs de privacidad.
- Los cambios Android pueden involucrar Gradle, manifiesto, Kotlin y configuración de Talsec; los cambios iOS pueden involucrar Podfile, Xcode project, plist, Swift y Objective-C bridge. Modifica solo las superficies necesarias para la tarea.

## Preservación de cambios existentes

- Antes de editar, inspecciona `git status` y el contenido de los archivos implicados.
- No sobrescribas, reviertas ni elimines cambios preexistentes que no sean parte de la tarea.
- No limpies ni modifiques automáticamente archivos ignorados o generados, como `build`, `.gradle`, `node_modules`, Pods o `coverage`.
- `android/app/debug.keystore` está rastreado: no lo reemplaces ni elimines como parte de una limpieza.
- Si un cambio local existente entra en conflicto con la tarea, detente y pide indicaciones; si no entra en conflicto, consérvalo.
