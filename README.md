# Printer Hub

Centro de control industrial para multiples impresoras 3D con Klipper, Moonraker y biblioteca unificada de G-code.

## Incluye

- Dashboard en tiempo real para 5 impresoras
- Integracion live con Moonraker
- Control visual de energia y luz por impresora
- Biblioteca unificada de G-codes
- Importacion local de `.gcode` con extraccion automatica de miniatura, tiempo y material
- Host virtual compatible con OrcaSlicer para enviar `Print` directo a la biblioteca
- Sugerencia de impresora libre antes de despachar una impresion
- PWA instalable con notificaciones push para iPhone
- Base nativa iOS para widget y Live Activity

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + WebSockets
- Persistencia inicial: memoria/JSON con puntos de extension para SQLite/PostgreSQL
- Contenedores: Docker Compose

## Estructura

- `frontend/`: interfaz React
- `backend/`: API, WebSocket y servicios
- `backend/src/services/moonrakerService.js`: sincronizacion live con Moonraker
- `backend/src/services/homeAssistantService.js`: punto de integracion con Home Assistant
- `backend/src/services/notificationService.js`: push notifications web
- `ios/PrinterHubIOS/`: app iPhone + widget + Live Activity base

## Desarrollo local

Instalacion:

```bash
npm run install:all
```

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Version unificada:

```bash
npm run build
npm run start
```

Luego abre `http://localhost:8099`.

## iPhone

### Fase 1: PWA con notificaciones

1. Publica la web con `HTTPS`.
2. En iPhone abre `https://gestor3d.platia.com.co` en Safari.
3. Toca `Compartir` -> `Agregar a pantalla de inicio`.
4. Abre la app instalada.
5. Dentro de `Printer Hub`, toca `Activar push`.
6. Permite notificaciones cuando iOS lo pida.

Eventos que ya pueden disparar aviso:

- impresion terminada
- impresora lista
- error
- apagado por Home Assistant

### Fase 2: app iOS nativa

Dentro de `ios/PrinterHubIOS` queda la base para:

- app nativa iPhone
- widget
- Live Activity inicial

Generacion del proyecto en Mac:

```bash
cd ios/PrinterHubIOS
brew install xcodegen
xcodegen generate
open PrinterHubIOS.xcodeproj
```

Lee tambien:

- `ios/PrinterHubIOS/README.md`

## Despliegue en servidor

1. Clonar o hacer `git pull` del repositorio.
2. Instalar dependencias:

```bash
npm run install:all
```

3. Construir frontend:

```bash
npm run build
```

4. Levantar backend en produccion:

```bash
npm run start
```

El backend sirve automaticamente el `frontend/dist`, asi que en produccion solo necesitas el proceso del backend.

## OrcaSlicer como host virtual

Puedes configurar OrcaSlicer para que el boton `Print` envie el archivo al gestor y no a una impresora final.

- `Host Type`: `Octo/Klipper`
- `Hostname, IP or URL`: `https://gestor3d.platia.com.co`
- `Device UI`: `https://gestor3d.platia.com.co`
- `API Key / Password`: dejar vacio

El archivo se recibe en el gestor, se guarda en `Biblioteca`, se extraen miniatura/material/tiempo y luego decides a que impresora mandarlo.

Compatibilidad implementada:

- `POST /server/files/upload`
- `POST /api/files/local`
- `GET /api/version`
- `GET /server/info`
- `GET /api/notifications/config`
- `POST /api/notifications/subscribe`

## Variables de entorno

Copia `.env.example` si necesitas parametrizar el servidor:

```bash
PORT=8099
CORS_ORIGIN=http://localhost:5173
HOME_ASSISTANT_URL=
HOME_ASSISTANT_TOKEN=
VAPID_SUBJECT=mailto:printerhub@local
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## Docker

Para levantar la app con Docker:

```bash
docker compose up --build
```

1. Crea un archivo `.env` en la raiz del proyecto:

```bash
HOME_ASSISTANT_URL=http://192.168.1.71:8123
HOME_ASSISTANT_TOKEN=tu_token_largo
```

2. Levanta el contenedor:

```bash
docker compose up -d --build
```

## Integraciones que aun pueden llevarse a real

- `backend/src/services/homeAssistantService.js`
- `backend/src/services/printerAssignmentService.js`
- `frontend/src/components/CameraPreview.jsx`

Moonraker live ya esta operativo en la flota configurada. Home Assistant aun esta en modo simulado hasta conectar URL y token reales.
