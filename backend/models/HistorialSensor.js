'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo HistorialSensor
 * Almacena todas las lecturas ambientales registradas por los dispositivos IoT.
 * Cada registro es una snapshot completa del ambiente en un punto en el tiempo.
 *
 * @param {import('sequelize').Sequelize} sequelize - Instancia de Sequelize
 * @param {import('sequelize').DataTypes} DataTypes - Tipos de datos de Sequelize
 * @returns {import('sequelize').Model} Modelo HistorialSensor
 */
module.exports = (sequelize, DataTypes) => {
  const HistorialSensor = sequelize.define(
    'HistorialSensor',
    {
      // ── Clave Primaria ────────────────────────────────────────────────────
      id_historial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del registro de sensor',
      },

      // ── Marca de Tiempo ───────────────────────────────────────────────────
      fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha y hora exacta de la lectura del sensor',
      },

      // ── Variables Meteorológicas ──────────────────────────────────────────
      temperatura: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Temperatura en grados Celsius (°C)',
      },
      humedad: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Humedad relativa en porcentaje (%)',
      },
      velocidad_viento: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Velocidad del viento en kilómetros por hora (km/h)',
      },
      direccion_viento: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Dirección del viento en grados (0-360°, donde 0°=Norte)',
      },
      precipitacion: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Precipitación acumulada en milímetros (mm)',
      },
      radiacion_solar: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Radiación solar en Watts por metro cuadrado (W/m²)',
      },

      // ── Calidad del Aire ──────────────────────────────────────────────────
      co2: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Dióxido de carbono en partes por millón (ppm)',
      },
      co: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Monóxido de carbono en partes por millón (ppm)',
      },
      pm_25: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Material particulado PM2.5 en microgramos por metro cúbico (µg/m³)',
      },
      pm_10: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Material particulado PM10 en microgramos por metro cúbico (µg/m³)',
      },

      // ── Clave Foránea ─────────────────────────────────────────────────────
      id_dispositivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dispositivos',
          key: 'id_dispositivo',
        },
        comment: 'ID del dispositivo IoT que generó la lectura',
      },
    },
    {
      tableName: 'historial_sensores',
      timestamps: false,
      comment: 'Tabla de lecturas históricas de sensores ambientales',
      indexes: [
        // Índice para consultas frecuentes por dispositivo y tiempo
        { fields: ['id_dispositivo', 'fecha_hora'] },
        { fields: ['fecha_hora'] },
      ],
    }
  );

  return HistorialSensor;
};
