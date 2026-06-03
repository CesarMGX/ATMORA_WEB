'use strict';

const express    = require('express');
const morgan     = require('morgan');
const swaggerUi  = require('swagger-ui-express');
require('dotenv').config();

// ─── Configuraciones ──────────────────────────────────────────────────────────
const { connectDB, sequelize } = require('./configs/database');
const swaggerSpec              = require('./configs/swagger');

// ─── Middlewares personalizados ───────────────────────────────────────────────
const corsConfig    = require('./middlewares/corsConfig');
const errorHandler  = require('./middlewares/errorHandler');

// ─── Rutas ────────────────────────────────────────────────────────────────────
const historialRoutes = require('./routes/historial.routes');
// Rutas del sistema
const dispositivoRoutes = require('./routes/dispositivo.routes');
const ubicacionRoutes   = require('./routes/ubicacion.routes');
const alertaRoutes      = require('./routes/alerta.routes');
const usuarioRoutes     = require('./routes/usuario.routes');

// ─── Modelos (necesario para sincronizar relaciones) ──────────────────────────
require('./models');

// ─── Instancia de Express ─────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ═════════════════════════════════════════════════════════════════════════════
//  MIDDLEWARES GLOBALES
// ═════════════════════════════════════════════════════════════════════════════
app.use(corsConfig);                          // CORS
app.use(express.json({ limit: '10mb' }));     // Parseo de JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parseo URL-encoded
app.use(morgan('dev'));                        // Logger HTTP (solo desarrollo)

// ═════════════════════════════════════════════════════════════════════════════
//  DOCUMENTACIÓN SWAGGER
// ═════════════════════════════════════════════════════════════════════════════
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Atmora API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #0f172a; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
  })
);

// Endpoint para obtener el JSON de la especificación OpenAPI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ═════════════════════════════════════════════════════════════════════════════
//  RUTAS DE LA API
// ═════════════════════════════════════════════════════════════════════════════
app.use('/api/historial',    historialRoutes);
app.use('/api/dispositivos', dispositivoRoutes);
app.use('/api/ubicaciones',  ubicacionRoutes);
app.use('/api/alertas',      alertaRoutes);
app.use('/api/usuarios',     usuarioRoutes);

// ─── Ruta de salud del servidor ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Atmora API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Ruta 404 (debe ir antes del errorHandler) ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `La ruta ${req.method} ${req.originalUrl} no existe en esta API`,
  });
});

// ─── Middleware de manejo de errores (SIEMPRE AL FINAL) ───────────────────────
app.use(errorHandler);

// ═════════════════════════════════════════════════════════════════════════════
//  ARRANQUE DEL SERVIDOR
// ═════════════════════════════════════════════════════════════════════════════
const startServer = async () => {
  try {
    // 1. Verificar conexión a la base de datos
    await connectDB();

    // 2. Sincronizar modelos con la DB (no fuerza recreación de tablas)
    await sequelize.sync({ alter: false });
    console.log('Modelos sincronizados con la base de datos');

    // 3. Iniciar el servidor HTTP
    app.listen(PORT, () => {
      console.log(`API corriendo en http://localhost:${PORT}`);
      console.log(`Swagger UI en     http://localhost:${PORT}/api-docs`);
      console.log(`ealth check en   http://localhost:${PORT}/health`);
      console.log('══════════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌  Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Exportar para testing
