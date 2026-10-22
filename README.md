# auth_app

Aplicación móvil de aprendizaje construida con React Native y TypeScript. El
repositorio también sirve para integrar y practicar procesos de desarrollo
asistidos por IA: las instrucciones y herramientas de IA viven en `.github/`,
y la documentación funcional de cada característica se organiza en
`docs/features/`.

## Estado actual

La aplicación incluye:

- Inicio de sesión con la API de demostración DummyJSON.
- Restauración y renovación de sesión cuando se vuelve a abrir la aplicación,
  y cierre de sesión local.
- Pantalla autenticada con catálogo de productos DummyJSON, búsqueda por nombre
  y vista de detalle.
- Interfaz con una estética glassmorphism.

DummyJSON es un servicio externo de demostración; esta aplicación no representa
por sí sola una solución lista para producción.

## Tecnologías y requisitos

- Node.js `>= 22.11.0` (requisito indicado en `package.json`).
- JDK 21 para compilar Android.
- React Native `0.86.0`, React `19.2.3` y TypeScript.
- Android SDK: plataforma/API 36 y Android Build Tools `36.0.0`.
- Gradle Wrapper `9.3.1` y Kotlin `2.1.20` (configurados por el proyecto).
- Android Studio con un emulador configurado, o un dispositivo Android con
  depuración USB habilitada.

Instala Android Studio y sus herramientas de SDK, configura `JAVA_HOME` para
apuntar al JDK 21 y asegúrate de que el SDK de Android esté instalado y
disponible en el entorno. Instala la plataforma Android 36 y Android Build
Tools `36.0.0` desde **Tools > SDK Manager**. En Linux, si el SDK está en su
ubicación habitual, puedes configurar estas variables en `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
```

Si el SDK está en otra ubicación, usa la ruta indicada en Android Studio.

## Ejecutar en Android

1. Clona el repositorio y entra en su carpeta:

   ```bash
   git clone https://github.com/SergioVillanoReyes/auth_app.git
   cd auth_app
   ```

2. Instala las dependencias de JavaScript:

   ```bash
   npm ci
   ```

3. Inicia un emulador desde Android Studio o conecta un dispositivo Android
   con la depuración USB habilitada.

4. En una terminal, inicia Metro:

   ```bash
   npm start
   ```

5. En otra terminal, desde la raíz del proyecto, compila e inicia la app:

   ```bash
   npm run android
   ```

La primera compilación puede tardar mientras Gradle prepara las dependencias.
La app requiere conexión a Internet para comunicarse con DummyJSON.

## Arquitectura

El código de la aplicación está organizado por responsabilidades:

```text
src/
├── core/
│   ├── di/               # Composición de dependencias por funcionalidad
│   └── theme/            # Tokens visuales compartidos
├── domain/               # Entidades, contratos y casos de uso
├── data/
│   ├── datasource/       # Acceso a DummyJSON y almacenamiento nativo
│   ├── http/             # Cliente HTTP y errores de red
│   ├── repositories/     # Implementaciones de los contratos del dominio
│   └── storage/          # Persistencia de sesión
└── presentation/
    ├── components/       # Componentes reutilizables
    ├── context/          # Estado compartido de autenticación
    ├── hooks/            # Lógica de presentación
    ├── navigation/       # Selección de pantallas según la sesión
    └── screens/          # Login, carga, Home y catálogo
```

El flujo de dependencias va desde `presentation` hacia casos de uso y contratos
de `domain`; `data` implementa esos contratos para comunicarse con servicios
externos y el almacenamiento. `core/di` conecta las implementaciones. El dominio
se mantiene independiente de la interfaz y de los detalles de infraestructura.

Android e iOS conservan implementaciones nativas de `StorageModule`; el flujo
actual de sesión usa ese módulo para persistir los tokens. La protección nativa
del almacenamiento no es idéntica entre plataformas.

## Procesos de desarrollo asistidos por IA

La integración de IA es un propósito del **repositorio y su proceso de
desarrollo**, no una función que se ejecute dentro de la aplicación móvil.

- [`.github/`](./.github/) reúne el contexto e instrucciones de Copilot,
  instrucciones para pruebas, perfiles de agentes, prompts y skills. Estos
  recursos orientan tareas como planificar una funcionalidad, implementarla,
  revisar cambios y diagnosticar fallos de CI.
- [`docs/features/`](./docs/features/) contiene la documentación de
  características por carpeta. Los documentos de intención (`intent.md`),
  especificación (`spec.md`) y plan (`plan.md`) ayudan a definir alcance,
  comportamiento esperado y trabajo antes de implementar. Algunas funciones
  también incluyen decisiones, evaluaciones o criterios de revisión.

El flujo de trabajo esperado es documentar y acordar el alcance, implementar
según esos requisitos y revisar el resultado. Así, las herramientas de IA
trabajan con el contexto y los criterios propios del proyecto, en vez de
depender únicamente de instrucciones aisladas en cada solicitud.

## Comandos útiles

```bash
npm test             # Ejecuta las pruebas con Jest
npm run lint         # Ejecuta ESLint
npx tsc --noEmit     # Comprueba los tipos de TypeScript
```

Los comandos disponibles como scripts de npm se pueden consultar en
[`package.json`](./package.json).
