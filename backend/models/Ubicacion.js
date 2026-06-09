'use strict';

/**
 * Modelo Ubicacion
 * Representa un sitio físico donde se instala un dispositivo de monitoreo.
 */
module.exports = (sequelize, DataTypes) => {
  const Ubicacion = sequelize.define(
    'Ubicacion',
    {
      id_ubicacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la ubicación',
      },
      nombre_ubicacion: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Nombre descriptivo de la ubicación (ej. "Parque Central Norte")',
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
        comment: 'Estado operativo de la ubicación',
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción detallada del sitio de monitoreo',
      },
      // ── Campos Virtuales para compatibilidad externa ──
      id: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('id_ubicacion');
        }
      },
      nombre: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('nombre_ubicacion');
        },
        set(value) {
          this.setDataValue('nombre_ubicacion', value);
        }
      },
      latitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        validate: {
          min: { args: [-90], msg: 'La latitud debe ser mayor a -90' },
          max: { args: [90], msg: 'La latitud debe ser menor a 90' },
        },
        comment: 'Coordenada de latitud geográfica (-90 a 90)',
      },
      longitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        validate: {
          min: { args: [-180], msg: 'La longitud debe ser mayor a -180' },
          max: { args: [180], msg: 'La longitud debe ser menor a 180' },
        },
        comment: 'Coordenada de longitud geográfica (-180 a 180)',
      },
    },
    {
      tableName: 'ubicaciones',
      timestamps: false,
    }
  );

  return Ubicacion;
};
