# Especificación: estética glassmorphism

## Propósito y límites

Esta especificación define el cambio visual propuesto para las pantallas actuales de `auth_app`. No modifica el comportamiento funcional ni los contratos de autenticación, catálogo, búsqueda, detalle o navegación.

El alcance cubre la interfaz React Native. No incluye splash nativo ni barras del sistema. La opción recomendada es implementar una apariencia inspirada en vidrio mediante estilos existentes de React Native, sin blur real, librerías nuevas ni cambios nativos. Esta decisión requiere aprobación.

## Requisitos visuales

### GLASS-01: cobertura de pantallas

1. El lenguaje visual se aplica a Login, AuthLoadingScreen, Home y ProductsCatalogScreen, incluyendo sus estados de catálogo y detalle.
2. Las superficies principales relacionadas —paneles, tarjetas, campos y botones compartidos— usan tokens visuales coherentes.
3. Las superficies conservan suficiente separación visual entre sí y respecto del fondo.
4. Los estados de carga, vacío, error, retry, detalle y acciones disabled conservan su señalización funcional actual.

### GLASS-02: fondo y superficies

1. La aplicación presenta una capa de fondo compartida que hace perceptible la translucidez de las superficies.
2. Las superficies tipo vidrio usan un relleno translúcido, un borde sutil y, cuando corresponda, sombras/elevación compatibles con los estilos existentes de React Native.
3. El contenido interior —texto, iconos, campos e indicadores— se representa con color opaco y no hereda una opacidad que afecte su lectura.
4. El diseño mantiene el conjunto de colores de marca actual, salvo aprobación explícita de un cambio.
5. Los tokens visuales compartidos se concentran en `src/core/theme/`; no se duplican sistemáticamente valores de color, borde o superficie por pantalla.

### GLASS-03: comportamiento y compatibilidad

1. El cambio no altera navegación, estado, eventos, llamadas a servicios ni modelos.
2. Los controles mantienen sus etiquetas de accesibilidad, roles, estados disabled y callbacks.
3. Los textos de error y los indicadores de carga permanecen visibles y con la misma función.
4. Login conserva validación, envío, mensajes y estado de campos deshabilitados.
5. Home conserva logout disponible y Products conserva búsqueda, detalle, reintentos y estados de error/vacío.
6. No se añaden dependencias ni se modifican configuraciones nativas en la opción recomendada sin blur real.
7. Si se aprueba blur real, se debe revisar y aprobar por separado la dependencia, el soporte/plataforma, las implicaciones nativas y el fallback antes de implementarlo.

## Criterios de aceptación

- **GLASS-AC-01:** las cuatro pantallas React Native identificadas usan el lenguaje visual aprobado.
- **GLASS-AC-02:** las superficies principales muestran transparencia y un tratamiento de borde/reflejo/sombra consistente sobre el fondo elegido.
- **GLASS-AC-03:** el texto y los controles siguen siendo legibles; no se reduce la opacidad del contenido junto con la del panel.
- **GLASS-AC-04:** la paleta azul/amarillo se conserva, salvo decisión explícita en contrario.
- **GLASS-AC-05:** Login mantiene sus estados de formulario, validación, carga y error.
- **GLASS-AC-06:** AuthLoadingScreen mantiene sus estados de carga, error y reintento.
- **GLASS-AC-07:** Home conserva saludo, errores existentes y logout.
- **GLASS-AC-08:** catálogo y detalle mantienen sus estados, acciones, resultados y comportamiento de reintento.
- **GLASS-AC-09:** pruebas funcionales pertinentes pasan sin cambiar aserciones para ocultar una regresión.
- **GLASS-AC-10:** lint y TypeScript se ejecutan con los comandos existentes; fallos preexistentes se reportan como tales.
- **GLASS-AC-11:** la inspección visual manual en Android e iOS no encuentra controles ilegibles, estados ocultos o diferencias que rompan el tratamiento compartido. Si una plataforma no está disponible, se declara la limitación.
- **GLASS-AC-12:** el diff contiene solo tokens/estilos/componentes directamente relacionados con el alcance visual aprobado; no añade dependencias, configuración nativa o cambios funcionales no aprobados.

## Estados que deben conservarse

La apariencia nueva se aplica a estos estados existentes, sin introducir otros:

- Login: formulario normal, validación, envío y error.
- AuthLoading: inicialización, error y reintento.
- Home: saludo, error de logout, catálogo y acción de logout.
- Products: carga inicial, resultados, búsqueda, vacío, error/reintento, detalle, error de detalle y regreso al catálogo.

## Verificación propuesta

- Ejecutar las pruebas existentes pertinentes de Login, AuthContext, Home, Products y App.
- Ejecutar `npm run lint`.
- Ejecutar `npx tsc --noEmit`, comando documentado en `AGENTS.md`; comprobar que TypeScript siga declarado en `package.json`.
- Inspeccionar manualmente las pantallas y estados en Android e iOS cuando los entornos estén disponibles. Las pruebas de `react-test-renderer` no sustituyen esta revisión visual.
- Registrar exactamente los comandos ejecutados, los resultados y las limitaciones. No afirmar una validación visual o de plataforma si no se realizó.