'use strict';

const { Alerta, Dispositivo } = require('../models');

/**
 * @swagger
 * /api/alertas:
 *   get:
 *     summary: Obtener todas las alertas
 *     description: Retorna una lista con todas las alertas de valores ambientales críticos registradas en el sistema, incluyendo datos del dispositivo que la emitió.
 *     tags:
 *       - Alertas
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida con éxito.
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
 *                       id_alerta:
 *                         type: integer
 *                         example: 1
 *                       tipo_alerta:
 *                         type: string
 *                         enum: [temperatura_alta, temperatura_baja, humedad_alta, humedad_baja, co2_alto, co_alto, pm25_alto, pm10_alto, viento_fuerte, precipitacion_intensa, dispositivo_sin_señal]
 *                         example: "temperatura_alta"
 *                       valor_detectado:
 *                         type: number
 *                         format: float
 *                         example: 38.5
 *                       fecha_hora:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-15T12:00:00Z"
 *                       id_dispositivo:
 *                         type: integer
 *                         example: 3
 *                       dispositivo:
 *                         type: object
 *                         properties:
 *                           id_dispositivo:
 *                             type: integer
 *                             example: 3
 *                           nombre_dispositivo:
 *                             type: string
 *                             example: "SENSOR-A01"
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
 *                   example: "Error en el servidor al recuperar las alertas."
 */
const obtenerTodos = async (req, res) => {
  try {
    const alertas = await Alerta.findAll({
      include: [{
        model: Dispositivo,
        as: 'dispositivo',
        attributes: ['id_dispositivo', 'nombre_dispositivo', 'estado']
      }],
      order: [['fecha_hora', 'DESC']]
    });
    return res.status(200).json({
      status: 'success',
      data: alertas
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
 * /api/alertas/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     description: Recupera una alerta ambiental crítica por su ID único, incluyendo información complementaria del dispositivo asociado.
 *     tags:
 *       - Alertas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la alerta
 *     responses:
 *       200:
 *         description: Alerta encontrada.
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
 *                     id_alerta:
 *                       type: integer
 *                       example: 1
 *                     tipo_alerta:
 *                       type: string
 *                       example: "temperatura_alta"
 *                     valor_detectado:
 *                       type: number
 *                       example: 38.5
 *                     fecha_hora:
 *                       type: string
 *                       example: "2025-01-15T12:00:00Z"
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 3
 *                     dispositivo:
 *                       type: object
 *                       properties:
 *                         id_dispositivo:
 *                           type: integer
 *                           example: 3
 *                         nombre_dispositivo:
 *                           type: string
 *                           example: "SENSOR-A01"
 *       404:
 *         description: Alerta no encontrada.
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
 *                   example: "No se encontró la alerta con ID 1"
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
 *                   example: "Error en el servidor al recuperar la alerta."
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.findByPk(id, {
      include: [{
        model: Dispositivo,
        as: 'dispositivo',
        attributes: ['id_dispositivo', 'nombre_dispositivo', 'estado']
      }]
    });

    if (!alerta) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la alerta con ID ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: alerta
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
 * /api/alertas:
 *   post:
 *     summary: Crear una nueva alerta
 *     description: Registra una nueva alerta ambiental crítica en el sistema. Valida previamente que el dispositivo emisor exista en la base de datos.
 *     tags:
 *       - Alertas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_alerta
 *               - valor_detectado
 *               - id_dispositivo
 *             properties:
 *               tipo_alerta:
 *                 type: string
 *                 enum: [temperatura_alta, temperatura_baja, humedad_alta, humedad_baja, co2_alto, co_alto, pm25_alto, pm10_alto, viento_fuerte, precipitacion_intensa, dispositivo_sin_señal]
 *                 example: "temperatura_alta"
 *               valor_detectado:
 *                 type: number
 *                 format: float
 *                 example: 38.5
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-15T12:00:00Z"
 *               id_dispositivo:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Alerta registrada con éxito.
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
 *                   example: "Alerta registrada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_alerta:
 *                       type: integer
 *                       example: 1
 *                     tipo_alerta:
 *                       type: string
 *                       example: "temperatura_alta"
 *                     valor_detectado:
 *                       type: number
 *                       example: 38.5
 *                     fecha_hora:
 *                       type: string
 *                       example: "2025-01-15T12:00:00Z"
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 3
 *       404:
 *         description: El dispositivo emisor de la alerta no existe.
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
 *                   example: "No existe el dispositivo con ID 3"
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
 *                   example: "Error en el servidor al registrar la alerta."
 */
const crear = async (req, res) => {
  try {
    const { tipo_alerta, valor_detectado, fecha_hora, id_dispositivo } = req.body;

    // Validación preventiva: verificar si el dispositivo asociado existe
    const dispositivoExiste = await Dispositivo.findByPk(id_dispositivo);
    if (!dispositivoExiste) {
      return res.status(404).json({
        status: 'error',
        message: `No existe el dispositivo con ID ${id_dispositivo}`
      });
    }

    const nuevaAlerta = await Alerta.create({
      tipo_alerta,
      valor_detectado,
      fecha_hora,
      id_dispositivo
    });

    return res.status(201).json({
      status: 'success',
      message: 'Alerta registrada correctamente',
      data: nuevaAlerta
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
 * /api/alertas/{id}:
 *   put:
 *     summary: Actualizar una alerta existente
 *     description: Actualiza los detalles o estado de un registro de alerta específica. Si se modifica id_dispositivo, se valida su existencia.
 *     tags:
 *       - Alertas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la alerta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_alerta:
 *                 type: string
 *                 enum: [temperatura_alta, temperatura_baja, humedad_alta, humedad_baja, co2_alto, co_alto, pm25_alto, pm10_alto, viento_fuerte, precipitacion_intensa, dispositivo_sin_señal]
 *                 example: "viento_fuerte"
 *               valor_detectado:
 *                 type: number
 *                 example: 65.2
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-16T14:30:00Z"
 *               id_dispositivo:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Alerta actualizada exitosamente.
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
 *                   example: "Alerta actualizada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_alerta:
 *                       type: integer
 *                       example: 1
 *                     tipo_alerta:
 *                       type: string
 *                       example: "viento_fuerte"
 *                     valor_detectado:
 *                       type: number
 *                       example: 65.2
 *                     fecha_hora:
 *                       type: string
 *                       example: "2025-01-16T14:30:00Z"
 *                     id_dispositivo:
 *                       type: integer
 *                       example: 3
 *       404:
 *         description: Alerta o dispositivo no encontrados.
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
 *                   example: "No se encontró la alerta con ID 1 o el nuevo dispositivo no existe"
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
 *                   example: "Error en el servidor al actualizar la alerta."
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_alerta, valor_detectado, fecha_hora, id_dispositivo } = req.body;

    const alerta = await Alerta.findByPk(id);
    if (!alerta) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la alerta con ID ${id}`
      });
    }

    // Si se reasigna el dispositivo, validar que el nuevo dispositivo realmente exista
    if (id_dispositivo && id_dispositivo !== alerta.id_dispositivo) {
      const dispositivoExiste = await Dispositivo.findByPk(id_dispositivo);
      if (!dispositivoExiste) {
        return res.status(404).json({
          status: 'error',
          message: `No existe el dispositivo con ID ${id_dispositivo}`
        });
      }
    }

    await alerta.update({
      tipo_alerta: tipo_alerta !== undefined ? tipo_alerta : alerta.tipo_alerta,
      valor_detectado: valor_detectado !== undefined ? valor_detectado : alerta.valor_detectado,
      fecha_hora: fecha_hora !== undefined ? fecha_hora : alerta.fecha_hora,
      id_dispositivo: id_dispositivo !== undefined ? id_dispositivo : alerta.id_dispositivo
    });

    return res.status(200).json({
      status: 'success',
      message: 'Alerta actualizada correctamente',
      data: alerta
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
 * /api/alertas/{id}:
 *   delete:
 *     summary: Eliminar una alerta
 *     description: Remueve físicamente el registro de una alerta de la base de datos por su ID único.
 *     tags:
 *       - Alertas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la alerta a eliminar
 *     responses:
 *       200:
 *         description: Alerta eliminada con éxito.
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
 *                   example: "Alerta con ID 1 eliminada correctamente"
 *       404:
 *         description: Alerta no encontrada.
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
 *                   example: "No se encontró la alerta con ID 1"
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
 *                   example: "Error en el servidor al eliminar la alerta."
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.findByPk(id);

    if (!alerta) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la alerta con ID ${id}`
      });
    }

    await alerta.destroy();

    return res.status(200).json({
      status: 'success',
      message: `Alerta con ID ${id} eliminada correctamente`
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
  eliminar
};
