# Architecture

## Current structure

The project keeps its existing layer directories as a reusable React Native
template. Feature-specific data sources, models, repositories, entities, use
cases, presentation contexts, and hooks can be added when a feature requires
them.

```text
src/
├── core/
│   └── theme/            # Shared color, spacing, typography, radius, dimensions
├── data/
│   └── http/             # Reusable HTTP client and network connectivity helpers
├── domain/               # Feature-specific entities, repositories, and use cases
├── presentation/
│   ├── components/       # Shared UI components
│   ├── context/          # Feature-specific React contexts
│   ├── hooks/            # Feature-specific presentation hooks
│   ├── navigation/       # App entry navigation
│   └── screens/          # Home screen
└── __tests__/            # App and HTTP client tests
```

The `di`, `datasource`, `models`, `repositories`, `storage`, `entities`, and
`usecases` directories are intentionally retained for future features.

## Native storage

The Android and iOS `StorageModule` implementations remain available in their
native projects. No JavaScript storage adapter is currently connected.
