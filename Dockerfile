FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-runner
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
RUN mkdir -p /app/backend/storage/library
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8099
WORKDIR /app/backend
CMD ["node", "src/server.js"]
