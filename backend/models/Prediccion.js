'use strict';

/**
 * Modelo Prediccion
 * Almacena el historial de predicciones de temperatura generadas por el modelo de ML.
 */
module.exports = (sequelize, DataTypes) => {
  const Prediccion = sequelize.define(
    'Prediccion',
    {
      id_prediccion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del registro de predicción',
      },
      humedad: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Humedad relativa enviada para la predicción (%)',
      },
      presion: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Presión atmosférica enviada (hPa)',
      },
      radiacion: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Radiación solar enviada (W/m²)',
      },
      temperatura_predicha: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Temperatura estimada por el modelo de regresión (°C)',
      },
      fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha y hora exacta en que se generó la predicción',
      },
    },
    {
      tableName: 'predicciones',
      timestamps: false,
      comment: 'Historial de predicciones climáticas realizadas por el backend',
    }
  );

  return Prediccion;
};
