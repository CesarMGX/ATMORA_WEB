'use strict';

const { HistorialSensor, Dispositivo } = require('../models');
const { Op } = require('sequelize');

// ─── OBTENER TODOS LOS HISTORIALES (con paginación y filtros) ─────────────────
/**
 * @desc    Obtiene el listado paginado de lecturas de sensores.
 *          Soporta filtrado por dispositivo y rango de fechas.
 * @route   GET /api/historial
 * @access  Public
 */
const getHistoriales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      id_dispositivo,
      dispositivo_id,
      fecha_inicio,
      fecha_fin,
    } = req.query;

    const targetDeviceId = id_dispositivo || dispositivo_id;

    // Construcción dinámica del filtro WHERE
    const where = {};
    if (targetDeviceId) where.id_dispositivo = Number(targetDeviceId);
    if (fecha_inicio || fecha_fin) {
      where.fecha_hora = {};
      if (fecha_inicio) where.fecha_hora[Op.gte] = new Date(fecha_inicio);
      if (fecha_fin)    where.fecha_hora[Op.lte] = new Date(fecha_fin);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await HistorialSensor.findAndCountAll({
      where,
      limit:  Number(limit),
      offset,
      order:  [['fecha_hora', 'DESC']],
      include: [{
        model: Dispositivo,
        as: 'dispositivo',
        attributes: ['id_dispositivo', 'nombre_dispositivo', 'estado'],
      }],
    });

    res.status(200).json({
      status: 'success',
      total:  count,
      page:   Number(page),
      limit:  Number(limit),
      data:   rows,
    });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER UN HISTORIAL POR ID ──────────────────────────────────────────────
/**
 * @desc    Obtiene una lectura específica por su ID.
 * @route   GET /api/historial/:id
 * @access  Public
 */
const getHistorialById = async (req, res, next) => {
  try {
    const historial = await HistorialSensor.findByPk(req.params.id, {
      include: [{
        model: Dispositivo,
        as: 'dispositivo',
        attributes: ['id_dispositivo', 'nombre_dispositivo', 'estado'],
      }],
    });

    if (!historial) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el historial con ID ${req.params.id}`,
      });
    }

    res.status(200).json({ status: 'success', data: historial });
  } catch (error) {
    next(error);
  }
};

// ─── CREAR UN NUEVO HISTORIAL ─────────────────────────────────────────────────
/**
 * @desc    Registra una nueva lectura de sensor en la base de datos.
 *          Asigna automáticamente la fecha/hora actual si la petición no incluye fecha.
 *          Auto-registra el dispositivo si aún no existe para evitar pérdida de datos IoT.
 * @route   POST /api/historial
 * @access  Private (dispositivos IoT autorizados)
 */
const createHistorial = async (req, res, next) => {
  try {
    const {
      fecha_hora, fecha_registro,
      temperatura, humedad, presion, velocidad_viento,
      direccion_viento, precipitacion, radiacion_solar, radiacion,
      co2, co, pm_25, pm_10, id_dispositivo, dispositivo_id,
    } = req.body;

    const targetDeviceId = Number(id_dispositivo || dispositivo_id || 1);

    // Verificar que el dispositivo exista o auto-crearlo para no rechazar paquetes de hardware físico
    let dispositivo = await Dispositivo.findByPk(targetDeviceId);
    if (!dispositivo) {
      try {
        dispositivo = await Dispositivo.create({
          id_dispositivo: targetDeviceId,
          nombre_dispositivo: `Estación Sensor #${targetDeviceId}`,
          estado: 'activo',
          fecha_instalacion: new Date()
        });
      } catch (e) {
        dispositivo = await Dispositivo.create({
          nombre_dispositivo: `Estación Sensor #${targetDeviceId}`,
          estado: 'activo',
          fecha_instalacion: new Date()
        });
      }
    }

    // Parseo seguro de números para aceptar cadenas "25.4" o valores numéricos puros
    const parseNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) ? Number(val) : null);

    // Garantizar que siempre se asigne la fecha y hora actual del servidor (new Date())
    // Ignorando cualquier fecha estática, desactualizada o en blanco del payload Arduino/IoT
    const fechaFinal = new Date();
    const radiacionFinal = radiacion_solar !== undefined ? radiacion_solar : radiacion;

    const nuevoHistorial = await HistorialSensor.create({
      fecha_hora: fechaFinal,
      temperatura: parseNum(temperatura),
      humedad: parseNum(humedad),
      presion: parseNum(presion),
      velocidad_viento: parseNum(velocidad_viento),
      direccion_viento: parseNum(direccion_viento),
      precipitacion: parseNum(precipitacion),
      radiacion_solar: parseNum(radiacionFinal),
      co2: parseNum(co2),
      co: parseNum(co),
      pm_25: parseNum(pm_25),
      pm_10: parseNum(pm_10),
      id_dispositivo: dispositivo ? dispositivo.id_dispositivo : targetDeviceId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Lectura de sensor registrada correctamente',
      data: nuevoHistorial,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ACTUALIZAR UN HISTORIAL ──────────────────────────────────────────────────
/**
 * @desc    Actualiza los datos de una lectura existente.
 * @route   PUT /api/historial/:id
 * @access  Private (admin)
 */
const updateHistorial = async (req, res, next) => {
  try {
    const historial = await HistorialSensor.findByPk(req.params.id);

    if (!historial) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el historial con ID ${req.params.id}`,
      });
    }

    await historial.update(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Lectura actualizada correctamente',
      data: historial,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ELIMINAR UN HISTORIAL ────────────────────────────────────────────────────
/**
 * @desc    Elimina una lectura de sensor por su ID.
 * @route   DELETE /api/historial/:id
 * @access  Private (admin)
 */
const deleteHistorial = async (req, res, next) => {
  try {
    const historial = await HistorialSensor.findByPk(req.params.id);

    if (!historial) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el historial con ID ${req.params.id}`,
      });
    }

    await historial.destroy();

    res.status(200).json({
      status: 'success',
      message: `Lectura con ID ${req.params.id} eliminada correctamente`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistoriales,
  getHistorialById,
  createHistorial,
  updateHistorial,
  deleteHistorial,
};
