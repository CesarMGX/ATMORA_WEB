'use strict';

const { sequelize } = require('../configs/database');
const { DataTypes } = require('sequelize');

// ─── Importar Modelos ─────────────────────────────────────────────────────────
const Usuario       = require('./Usuario')(sequelize, DataTypes);
const Ubicacion     = require('./Ubicacion')(sequelize, DataTypes);
const Dispositivo   = require('./Dispositivo')(sequelize, DataTypes);
const HistorialSensor = require('./HistorialSensor')(sequelize, DataTypes);
const Alerta        = require('./Alerta')(sequelize, DataTypes);

// ─── Definir Relaciones ───────────────────────────────────────────────────────

// Una Ubicación tiene Muchos Dispositivos
Ubicacion.hasMany(Dispositivo, {
  foreignKey: 'id_ubicacion',
  as: 'dispositivos',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Dispositivo.belongsTo(Ubicacion, {
  foreignKey: 'id_ubicacion',
  as: 'ubicacion',
});

// Un Dispositivo tiene Muchos Historiales de Sensor
Dispositivo.hasMany(HistorialSensor, {
  foreignKey: 'id_dispositivo',
  as: 'historiales',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
HistorialSensor.belongsTo(Dispositivo, {
  foreignKey: 'id_dispositivo',
  as: 'dispositivo',
});

// Un Dispositivo tiene Muchas Alertas
Dispositivo.hasMany(Alerta, {
  foreignKey: 'id_dispositivo',
  as: 'alertas',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Alerta.belongsTo(Dispositivo, {
  foreignKey: 'id_dispositivo',
  as: 'dispositivo',
});

// ─── Exportar ─────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  Usuario,
  Ubicacion,
  Dispositivo,
  HistorialSensor,
  Alerta,
};
