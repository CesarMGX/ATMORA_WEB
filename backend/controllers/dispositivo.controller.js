'use strict';

const { Dispositivo, Ubicacion, HistorialSensor } = require('../models');

/**
 * @swagger
 * /api/dispositivos:
 *   get:
 *     summary: Obtener todos los dispositivos
 *     description: Retorna una lista con todos los dispositivos IoT registrados, incluyendo la información de su ubicación física asociada.
 *     tags:
 *       - Dispositivos
 *     responses:
 *       200:
 *         description: Lista de dispositivos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_dispositivo:
 *                         type: integer
 *                         example: 1
 *                       nombre_dispositivo:
 *                         type: string
 *                         example: "SENSOR-A01"
 *                       estado:
 *                         type: string
 *                         enum: [activo, inactivo, mantenimiento, falla]
 *                         example: "activo"
 *                       fecha_instalacion:
 *                         type: string
 *                         format: date
 *                         example: "2025-01-10"
 *                       id_ubicacion:
 *                         type: integer
 *                         example: 2
 *                       ubicacion:
 *                         type: object
 *                         properties:
 *                           id_ubicacion:
 *                             type: integer
 *                             example: 2
 *                           nombre_ubicacion:
 *                             type: string
 *                             example: "Parque Central Norte"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al recuperar los dispositivos."
 */
const obtenerTodos = async (req, res) => {
  try {
    const dispositivos = await Dispositivo.findAll({
      include: [{
        model: Ubicacion,
        as: 'ubicacion',
        attributes: ['id_ubicacion', 'nombre_ubicacion', 'estado', 'latitud', 'longitud']
      }]
    });
    return res.status(200).json({
      status: 'success',
      data: dispositivos
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   get:
 *     summary: Obtener dispositivo por ID
 *     description: Recupera un dispositivo específico utilizando su identificador único, incluyendo los datos de su ubicación asociada.
 *     tags:
 *       - Dispositivos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del dispositivo
 *     responses:
 *       200:
 *         description: Dispositivo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 1
 *                     nombre_dispositivo:
 *                       type: string
 *                       example: "SENSOR-A01"
 *                     estado:
 *                       type: string
 *                       enum: [activo, inactivo, mantenimiento, falla]
 *                       example: "activo"
 *                     fecha_instalacion:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-10"
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 2
 *                     ubicacion:
 *                       type: object
 *                       properties:
 *                         id_ubicacion:
 *                           type: integer
 *                           example: 2
 *                         nombre_ubicacion:
 *                           type: string
 *                           example: "Parque Central Norte"
 *       404:
 *         description: Dispositivo no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el dispositivo con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al recuperar el dispositivo."
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const dispositivo = await Dispositivo.findByPk(id, {
      include: [{
        model: Ubicacion,
        as: 'ubicacion',
        attributes: ['id_ubicacion', 'nombre_ubicacion', 'estado', 'latitud', 'longitud']
      }]
    });

    if (!dispositivo) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el dispositivo con ID ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: dispositivo
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos:
 *   post:
 *     summary: Crear un nuevo dispositivo
 *     description: Registra un nuevo dispositivo IoT en el sistema. Valida que la ubicación física asignada exista.
 *     tags:
 *       - Dispositivos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_dispositivo
 *               - id_ubicacion
 *             properties:
 *               nombre_dispositivo:
 *                 type: string
 *                 example: "SENSOR-A02"
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo, mantenimiento, falla]
 *                 default: "activo"
 *                 example: "activo"
 *               fecha_instalacion:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-15"
 *               id_ubicacion:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Dispositivo registrado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Dispositivo registrado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 2
 *                     nombre_dispositivo:
 *                       type: string
 *                       example: "SENSOR-A02"
 *                     estado:
 *                       type: string
 *                       example: "activo"
 *                     fecha_instalacion:
 *                       type: string
 *                       example: "2025-02-15"
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 1
 *       404:
 *         description: La ubicación especificada no existe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No existe la ubicación con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al registrar el dispositivo."
 */
const crear = async (req, res) => {
  try {
    const { nombre_dispositivo, estado, fecha_instalacion, id_ubicacion } = req.body;

    // Validación preventiva: verificar si la ubicación asociada existe
    const ubicacionExiste = await Ubicacion.findByPk(id_ubicacion);
    if (!ubicacionExiste) {
      return res.status(404).json({
        status: 'error',
        message: `No existe la ubicación con ID ${id_ubicacion}`
      });
    }

    const nuevoDispositivo = await Dispositivo.create({
      nombre_dispositivo,
      estado,
      fecha_instalacion,
      id_ubicacion
    });

    return res.status(201).json({
      status: 'success',
      message: 'Dispositivo registrado correctamente',
      data: nuevoDispositivo
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   put:
 *     summary: Actualizar un dispositivo existente
 *     description: Modifica los parámetros operativos de un dispositivo específico. Si se reasigna la ubicación, valida la existencia de la nueva ubicación.
 *     tags:
 *       - Dispositivos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del dispositivo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_dispositivo:
 *                 type: string
 *                 example: "SENSOR-A01-MOD"
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo, mantenimiento, falla]
 *                 example: "mantenimiento"
 *               fecha_instalacion:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-12"
 *               id_ubicacion:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Dispositivo actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Dispositivo actualizado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 1
 *                     nombre_dispositivo:
 *                       type: string
 *                       example: "SENSOR-A01-MOD"
 *                     estado:
 *                       type: string
 *                       example: "mantenimiento"
 *                     fecha_instalacion:
 *                       type: string
 *                       example: "2025-01-12"
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 3
 *       404:
 *         description: Dispositivo o nueva ubicación no encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el dispositivo con ID 1 o la nueva ubicación no existe"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al actualizar el dispositivo."
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_dispositivo, estado, fecha_instalacion, id_ubicacion } = req.body;

    const dispositivo = await Dispositivo.findByPk(id);
    if (!dispositivo) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el dispositivo con ID ${id}`
      });
    }

    // Si se reasigna la ubicación, validar que la nueva ubicación realmente exista
    if (id_ubicacion && id_ubicacion !== dispositivo.id_ubicacion) {
      const ubicacionExiste = await Ubicacion.findByPk(id_ubicacion);
      if (!ubicacionExiste) {
        return res.status(404).json({
          status: 'error',
          message: `No existe la ubicación con ID ${id_ubicacion}`
        });
      }
    }

    await dispositivo.update({
      nombre_dispositivo: nombre_dispositivo !== undefined ? nombre_dispositivo : dispositivo.nombre_dispositivo,
      estado: estado !== undefined ? estado : dispositivo.estado,
      fecha_instalacion: fecha_instalacion !== undefined ? fecha_instalacion : dispositivo.fecha_instalacion,
      id_ubicacion: id_ubicacion !== undefined ? id_ubicacion : dispositivo.id_ubicacion
    });

    return res.status(200).json({
      status: 'success',
      message: 'Dispositivo actualizado correctamente',
      data: dispositivo
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   delete:
 *     summary: Eliminar un dispositivo
 *     description: Remueve físicamente el registro de un dispositivo de la base de datos por su ID único. Las lecturas de sensores y alertas asociadas se eliminarán en cascada.
 *     tags:
 *       - Dispositivos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del dispositivo a eliminar
 *     responses:
 *       200:
 *         description: Dispositivo eliminado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Dispositivo con ID 1 eliminado correctamente"
 *       404:
 *         description: Dispositivo no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el dispositivo con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al eliminar el dispositivo."
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const dispositivo = await Dispositivo.findByPk(id);

    if (!dispositivo) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el dispositivo con ID ${id}`
      });
    }

    await dispositivo.destroy();

    return res.status(200).json({
      status: 'success',
      message: `Dispositivo con ID ${id} eliminado correctamente`
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}/ultima-lectura:
 *   get:
 *     summary: Obtener la última lectura de un dispositivo
 *     description: Recupera la lectura más reciente de temperatura, humedad, presión y radiación de la tabla de históricos asociada a un ID de dispositivo.
 *     tags:
 *       - Dispositivos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del dispositivo
 *     responses:
 *       200:
 *         description: Última lectura obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     humedad:
 *                       type: number
 *                       format: float
 *                       example: 65.2
 *                     presion:
 *                       type: number
 *                       format: float
 *                       example: 1013.25
 *                     radiacion:
 *                       type: number
 *                       format: float
 *                       example: 850.5
 *                     temperatura:
 *                       type: number
 *                       format: float
 *                       example: 24.5
 *                     fecha_registro:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-09T18:26:24Z"
 *       404:
 *         description: Dispositivo o lecturas no encontrados.
 *       500:
 *         description: Error interno del servidor.
 */
const obtenerUltimaLectura = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el dispositivo existe
    const dispositivo = await Dispositivo.findByPk(id);
    if (!dispositivo) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el dispositivo con ID ${id}`
      });
    }

    // Buscar el registro más reciente en HistorialSensor
    const ultimaLectura = await HistorialSensor.findOne({
      where: { id_dispositivo: id },
      order: [['fecha_hora', 'DESC']]
    });

    if (!ultimaLectura) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontraron registros históricos para el dispositivo con ID ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: ultimaLectura.id_historial,
        dispositivo_id: ultimaLectura.id_dispositivo,
        humedad: ultimaLectura.humedad,
        presion: ultimaLectura.presion,
        radiacion: ultimaLectura.radiacion_solar, // Aliasing para compatibilidad con ML
        radiacion_solar: ultimaLectura.radiacion_solar,
        temperatura: ultimaLectura.temperatura,
        fecha_registro: ultimaLectura.fecha_hora, // Aliasing para compatibilidad con ML
        fecha_hora: ultimaLectura.fecha_hora
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  obtenerUltimaLectura
};
