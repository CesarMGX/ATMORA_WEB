'use strict';

/**
 * Modelo Dispositivo
 * Representa un dispositivo IoT de monitoreo ambiental instalado en una ubicación.
 */
module.exports = (sequelize, DataTypes) => {
  const Dispositivo = sequelize.define(
    'Dispositivo',
    {
      id_dispositivo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del dispositivo',
      },
      nombre_dispositivo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: 'Nombre o código identificador del dispositivo (ej. "SENSOR-A01")',
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'mantenimiento', 'falla'),
        allowNull: false,
        defaultValue: 'activo',
        comment: 'Estado operativo actual del dispositivo',
      },
      fecha_instalacion: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que el dispositivo fue instalado en la ubicación',
      },
      id_ubicacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ubicaciones',
          key: 'id_ubicacion',
        },
        comment: 'ID de la ubicación donde está instalado el dispositivo',
      },
    },
    {
      tableName: 'dispositivos',
      timestamps: false,
      indexes: [
        { fields: ['id_ubicacion'] },
        { fields: ['estado'] },
      ],
    }
  );

  return Dispositivo;
};
