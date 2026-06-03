'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

// ─── Instancia de Sequelize ───────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

const sequelize = hasDatabaseUrl
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: isProduction
          ? {
              require: true,
              rejectUnauthorized: false, // Requerido por Railway/Heroku/Render
            }
          : false,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        // Desactiva timestamps automáticos (createdAt/updatedAt) globalmente
        timestamps: false,
        // Usa snake_case para los nombres de columnas en DB
        underscored: true,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true'
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          // Desactiva timestamps automáticos (createdAt/updatedAt) globalmente
          timestamps: false,
          // Usa snake_case para los nombres de columnas en DB
          underscored: true,
        },
      }
    );


// ─── Verificación de Conexión ─────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
