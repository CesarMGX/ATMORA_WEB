'use strict';

/**
 * Modelo Usuario
 * Representa a los usuarios del sistema con su información personal, avatar y rol.
 */
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del usuario',
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nombre(s) del usuario',
      },
      ap_paterno: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Apellido paterno del usuario',
      },
      ap_materno: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Apellido materno del usuario',
      },
      correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'El formato del correo electrónico no es válido' },
        },
        comment: 'Correo electrónico único del usuario (usado para login)',
      },
      contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Hash de la contraseña (bcrypt)',
      },
      rol: {
        type: DataTypes.ENUM('admin', 'operador', 'visualizador'),
        allowNull: false,
        defaultValue: 'visualizador',
        comment: 'Rol del usuario en el sistema',
      },
      avatar: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL de la foto de perfil en Cloudinary',
      },
      fecha_registro: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha y hora de registro del usuario',
      },
      tipo_suscripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'GRATIS',
        comment: 'Tipo de suscripción: GRATIS o PRO_MENSUAL',
      },
      subscription_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID de suscripción / preapproval en Mercado Pago',
      },
      payer_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID del pagador en Mercado Pago',
      },
      subscription_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Estado de la suscripción en Mercado Pago (authorized, paused, cancelled, etc.)',
      },
    },
    {
      tableName: 'usuarios',
      timestamps: false,
    }
  );

  return Usuario;
};
