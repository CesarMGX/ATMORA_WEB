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
      fecha_inicio,
      fecha_fin,
    } = req.query;

    // Construcción dinámica del filtro WHERE
    const where = {};
    if (id_dispositivo) where.id_dispositivo = Number(id_dispositivo);
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
 * @route   POST /api/historial
 * @access  Private (dispositivos IoT autorizados)
 */
const createHistorial = async (req, res, next) => {
  try {
    const {
      fecha_hora, temperatura, humedad, velocidad_viento,
      direccion_viento, precipitacion, radiacion_solar,
      co2, co, pm_25, pm_10, id_dispositivo,
    } = req.body;

    // Verificar que el dispositivo exista
    const dispositivo = await Dispositivo.findByPk(id_dispositivo);
    if (!dispositivo) {
      return res.status(404).json({
        status: 'error',
        message: `No existe el dispositivo con ID ${id_dispositivo}`,
      });
    }

    const nuevoHistorial = await HistorialSensor.create({
      fecha_hora, temperatura, humedad, velocidad_viento,
      direccion_viento, precipitacion, radiacion_solar,
      co2, co, pm_25, pm_10, id_dispositivo,
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
