# Printer Hub

Centro de control industrial para multiples impresoras 3D con Klipper, Moonraker y biblioteca unificada de G-code.

## Incluye

- Dashboard en tiempo real para 5 impresoras
- Integracion live con Moonraker
- Control visual de energia y luz por impresora
- Biblioteca unificada de G-codes
- Importacion local de `.gcode` con extraccion automatica de miniatura, tiempo y material
- Sugerencia de impresora libre antes de despachar una impresion

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

## Variables de entorno

Copia `.env.example` si necesitas parametrizar el servidor:

```bash
PORT=8099
CORS_ORIGIN=http://localhost:5173
HOME_ASSISTANT_URL=
HOME_ASSISTANT_TOKEN=
```

## Docker

Para entorno de desarrollo:

```bash
docker compose up --build
```

## Integraciones que aun pueden llevarse a real

- `backend/src/services/homeAssistantService.js`
- `backend/src/services/printerAssignmentService.js`
- `frontend/src/components/CameraPreview.jsx`

Moonraker live ya esta operativo en la flota configurada. Home Assistant aun esta en modo simulado hasta conectar URL y token reales.
