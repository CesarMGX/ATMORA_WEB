'use strict';

/**
 * Modelo Alerta
 * Registra alertas generadas automáticamente cuando un sensor detecta valores críticos.
 */
module.exports = (sequelize, DataTypes) => {
  const Alerta = sequelize.define(
    'Alerta',
    {
      id_alerta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la alerta',
      },
      tipo_alerta: {
        type: DataTypes.ENUM(
          'temperatura_alta',
          'temperatura_baja',
          'humedad_alta',
          'humedad_baja',
          'co2_alto',
          'co_alto',
          'pm25_alto',
          'pm10_alto',
          'viento_fuerte',
          'precipitacion_intensa',
          'dispositivo_sin_señal'
        ),
        allowNull: false,
        comment: 'Tipo o categoría de la alerta generada',
      },
      valor_detectado: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Valor exacto del sensor que disparó la alerta',
      },
      fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha y hora en que se generó la alerta',
      },
      id_dispositivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dispositivos',
          key: 'id_dispositivo',
        },
        comment: 'ID del dispositivo que generó la alerta',
      },
    },
    {
      tableName: 'alertas',
      timestamps: false,
      indexes: [
        { fields: ['id_dispositivo', 'fecha_hora'] },
        { fields: ['tipo_alerta'] },
      ],
    }
  );

  return Alerta;
};
