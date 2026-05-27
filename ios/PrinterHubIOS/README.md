# Printer Hub iPhone

Base nativa para:
- app iPhone de monitoreo
- widget de estado
- Live Activity inicial para una impresora

## Requisitos

- macOS
- Xcode 15 o superior
- Homebrew
- `xcodegen`

## Generar el proyecto

```bash
cd ios/PrinterHubIOS
brew install xcodegen
xcodegen generate
open PrinterHubIOS.xcodeproj
```

## Antes de compilar

1. Cambia los bundle identifiers en `project.yml` si lo necesitas.
2. Configura tu equipo de firma en Xcode.
3. Crea el App Group:
   - `group.com.platia.printerhub`
4. Asigna ese App Group tanto a la app como al widget.
5. Si vas a usar Live Activities, habilita esa capability.

## Como funciona

- La app consulta `https://gestor3d.platia.com.co/api/system/bootstrap`
- Guarda el estado compartido en App Group
- El widget lee ese cache y muestra:
  - impresora activa
  - progreso
  - tiempo restante
- La app puede iniciar una Live Activity manual desde la lista

## Limitacion actual

La Live Activity queda lista como base funcional, pero para actualizacion remota continua mientras el iPhone esta bloqueado necesitas:
- cuenta Apple Developer
- configuracion APNs
- push-to-update para ActivityKit

Mientras tanto:
- el widget funciona con el ultimo estado sincronizado por la app
- la Live Activity se puede iniciar y actualizar cuando la app refresca en foreground
