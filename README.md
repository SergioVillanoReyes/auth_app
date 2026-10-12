# auth_app

Minimal React Native application with a simple home screen and a reusable
project structure. Feature-specific data and domain code can be added as needed.

## Requirements

- Node.js `>= 22.11.0`
- Android SDK for Android development
- Java 21 for Android development
- Xcode and CocoaPods for iOS development on macOS

The Android development environment has been verified with:

```text
Node.js v24.21.0
OpenJDK Temurin 21.0.12.1 LTS
```

## Install and run

```bash
npm install
npm start
```

In another terminal, launch a platform:

```bash
npm run android
npm run ios
```

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the current source layout.
The native Android and iOS storage modules remain available, but no JavaScript
storage adapter is currently connected.

## Android runtime protection

The Android app retains its existing Talsec RASP integration. Do not change its
runtime checks, response behavior, hashes, signing, or credentials without
explicit authorization.

## Tests

```bash
npm test
```
