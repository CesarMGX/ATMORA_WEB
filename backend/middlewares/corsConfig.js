'use strict';

const cors = require('cors');
require('dotenv').config();

// Orígenes permitidos (incluye dinámicamente el propio origen del servidor para Swagger)
const backendPort = process.env.PORT || 3000;
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN || 'http://localhost:4200').split(','),
  `http://localhost:${backendPort}`
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requests sin origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: El origen "${origin}" no está permitido.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 200, // Para compatibilidad con IE11
};

module.exports = cors(corsOptions);
