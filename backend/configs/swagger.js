'use strict';

const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

// ─── Opciones de Swagger ──────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Atmora API - Sistema de Monitoreo Ambiental',
      version: '1.0.0',
      description: `
## API RESTful para el sistema de monitoreo ambiental **Atmora**.

Gestiona dispositivos IoT, sensores ambientales, alertas y usuarios del sistema.

### Módulos disponibles:
- **Ubicaciones** — Gestión de sitios de monitoreo
- **Dispositivos** — Administración de hardware IoT
- **Historial de Sensores** — Lecturas ambientales (temperatura, humedad, CO₂, etc.)
- **Alertas** — Notificaciones por valores críticos
- **Usuarios** — Control de acceso y roles
      `,
      contact: {
        name: 'Equipo Atmora',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'https://atmoraweb-production.up.railway.app',
        description: 'Servidor de Producción (Railway)',
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de Desarrollo Local',
      },
    ],
    tags: [
      { name: 'Historial', description: 'Lecturas de sensores ambientales' },
      { name: 'Dispositivos', description: 'Gestión de dispositivos IoT' },
      { name: 'Ubicaciones', description: 'Gestión de ubicaciones de monitoreo' },
      { name: 'Alertas', description: 'Alertas por valores críticos' },
    ],
    components: {
      schemas: {
        // ── HistorialSensor ──────────────────────────────────────────────────
        HistorialSensor: {
          type: 'object',
          properties: {
            id_historial: { type: 'integer', example: 1 },
            fecha_hora: { type: 'string', format: 'date-time', example: '2025-01-15T08:30:00Z' },
            temperatura: { type: 'number', format: 'float', example: 22.5 },
            humedad: { type: 'number', format: 'float', example: 65.3 },
            velocidad_viento: { type: 'number', format: 'float', example: 12.8 },
            direccion_viento: { type: 'number', format: 'float', example: 180.0 },
            precipitacion: { type: 'number', format: 'float', example: 0.0 },
            radiacion_solar: { type: 'number', format: 'float', example: 850.5 },
            co2: { type: 'number', format: 'float', example: 412.3 },
            co: { type: 'number', format: 'float', example: 0.5 },
            pm_25: { type: 'number', format: 'float', example: 15.2 },
            pm_10: { type: 'number', format: 'float', example: 28.7 },
            id_dispositivo: { type: 'integer', example: 3 },
          },
        },
        HistorialSensorInput: {
          type: 'object',
          required: ['fecha_hora', 'id_dispositivo'],
          properties: {
            fecha_hora: { type: 'string', format: 'date-time', example: '2025-01-15T08:30:00Z' },
            temperatura: { type: 'number', format: 'float', example: 22.5 },
            humedad: { type: 'number', format: 'float', example: 65.3 },
            velocidad_viento: { type: 'number', format: 'float', example: 12.8 },
            direccion_viento: { type: 'number', format: 'float', example: 180.0 },
            precipitacion: { type: 'number', format: 'float', example: 0.0 },
            radiacion_solar: { type: 'number', format: 'float', example: 850.5 },
            co2: { type: 'number', format: 'float', example: 412.3 },
            co: { type: 'number', format: 'float', example: 0.5 },
            pm_25: { type: 'number', format: 'float', example: 15.2 },
            pm_10: { type: 'number', format: 'float', example: 28.7 },
            id_dispositivo: { type: 'integer', example: 3 },
          },
        },
        // ── Respuesta de Error ───────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Descripción del error' },
          },
        },
        // ── Respuesta de Éxito (paginada) ────────────────────────────────────
        PaginatedResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            data: { type: 'array', items: {} },
          },
        },
      },
    },
  },
  // Rutas donde swagger-jsdoc buscará comentarios JSDoc
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;
