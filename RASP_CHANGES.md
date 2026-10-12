# Cambios RASP realizados hasta ahora

Este documento resume los cambios de seguridad RASP que se han aplicado en el proyecto.

## 1. Integración de Talsec

- Se añadió la dependencia de RASP en `android/app/build.gradle`:
  - `implementation("com.aheaditec.talsec.security:TalsecSecurity-Community:18.0.2")`
- Se configura el hash de producción `TALSEC_PROD_HASH` en `android/gradle.properties`.
- Antes de esto, se debe generar el certificado y su hash con un comando similar a:
  ```bash
  keytool -exportcert \
    -alias TU_ALIAS \
    -keystore app/keystore.jks \
    -storepass TU_PASSWORD \
  | openssl sha256 -binary \
  | openssl base64
  ```
- `android/app/build.gradle` expone el valor a través de `buildConfigField`.

## 2. Repositorio Maven adicional

- El repositorio de artefactos de Talsec está definido en `android/settings.gradle`:
  - `https://europe-west3-maven.pkg.dev/talsec-artifact-repository/freerasp`

## 3. Seguridad en tiempo de ejecución

- `android/app/src/main/java/com/auth_app/SecurityManager.kt` implementa la comprobación RASP.
- Se crea un `ThreatListener` para capturar eventos de seguridad:
  - `onRootDetected()` -> `ROOT_DETECTED`
  - `onDebuggerDetected()` -> `DEBUGGER_ATTACHED`
  - `onEmulatorDetected()` -> `EMULATOR_DETECTED`
  - `onHookDetected()` -> `DYNAMIC_HOOK_DETECTED`
  - `onTamperDetected()` -> `APK_TAMPERING`
- Se construye el objeto `TalsecConfig` con el paquete de la app y los hashes esperados.
- El componente RASP se inicia en modo de fondo con `Talsec.start(context, config, TalsecMode.BACKGROUND)`.

## 4. Activación en el ciclo de vida de Android

- `android/app/src/main/java/com/auth_app/MainActivity.kt` llama a `SecurityManager.checkRuntimeSecurity(this)` en:
  - `onStart()`
  - `onResume()`
- Si se detecta una amenaza, la app registra el tipo de amenaza y termina la tarea con `finishAndRemoveTask()`.

## 5. Detalles adicionales

- El correo configurado para notificaciones es `villanoreyes@hotmail.com`.
- El flujo actual usa `BuildConfig.DEBUG` para alternar la configuración de producción de Talsec.
- El sistema de seguridad está centrado en Android; no se han documentado implementaciones RASP para iOS en este proyecto.
