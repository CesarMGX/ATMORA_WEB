'use strict';

const { Ubicacion, Dispositivo } = require('../models');

/**
 * @swagger
 * /api/ubicaciones:
 *   get:
 *     summary: Obtener todas las ubicaciones
 *     description: Retorna una lista con todas las ubicaciones físicas de monitoreo ambiental registradas en el sistema.
 *     tags:
 *       - Ubicaciones
 *     responses:
 *       200:
 *         description: Lista de ubicaciones obtenida con éxito.
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
 *                       id_ubicacion:
 *                         type: integer
 *                         example: 1
 *                       nombre_ubicacion:
 *                         type: string
 *                         example: "Parque Central Norte"
 *                       estado:
 *                         type: string
 *                         enum: [activo, inactivo]
 *                         example: "activo"
 *                       descripcion:
 *                         type: string
 *                         example: "Ubicado en el área recreativa central"
 *                       latitud:
 *                         type: number
 *                         format: float
 *                         example: 19.432608
 *                       longitud:
 *                         type: number
 *                         format: float
 *                         example: -99.133209
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
 *                   example: "Error en el servidor al recuperar las ubicaciones."
 */
const obtenerTodos = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.findAll();
    return res.status(200).json({
      status: 'success',
      data: ubicaciones
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
 * /api/ubicaciones/{id}:
 *   get:
 *     summary: Obtener ubicación por ID
 *     description: Recupera los detalles de una ubicación específica utilizando su ID único.
 *     tags:
 *       - Ubicaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación encontrada.
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
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 1
 *                     nombre_ubicacion:
 *                       type: string
 *                       example: "Parque Central Norte"
 *                     estado:
 *                       type: string
 *                       enum: [activo, inactivo]
 *                       example: "activo"
 *                     descripcion:
 *                       type: string
 *                       example: "Ubicado en el área recreativa central"
 *                     latitud:
 *                       type: number
 *                       example: 19.432608
 *                     longitud:
 *                       type: number
 *                       example: -99.133209
 *       404:
 *         description: Ubicación no encontrada.
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
 *                   example: "No se encontró la ubicación con ID 1"
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
 *                   example: "Error en el servidor al recuperar la ubicación."
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ubicacion = await Ubicacion.findByPk(id);

    if (!ubicacion) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la ubicación con ID ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: ubicacion
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
 * /api/ubicaciones:
 *   post:
 *     summary: Crear una nueva ubicación
 *     description: Registra una nueva ubicación geográfica de monitoreo en el sistema.
 *     tags:
 *       - Ubicaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_ubicacion
 *               - latitud
 *               - longitud
 *             properties:
 *               nombre_ubicacion:
 *                 type: string
 *                 example: "Parque Central Norte"
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo]
 *                 default: "activo"
 *                 example: "activo"
 *               descripcion:
 *                 type: string
 *                 example: "Ubicado en el área recreativa central"
 *               latitud:
 *                 type: number
 *                 format: float
 *                 example: 19.432608
 *               longitud:
 *                 type: number
 *                 format: float
 *                 example: -99.133209
 *     responses:
 *       201:
 *         description: Ubicación creada exitosamente.
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
 *                   example: "Ubicación registrada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 1
 *                     nombre_ubicacion:
 *                       type: string
 *                       example: "Parque Central Norte"
 *                     estado:
 *                       type: string
 *                       example: "activo"
 *                     descripcion:
 *                       type: string
 *                       example: "Ubicado en el área recreativa central"
 *                     latitud:
 *                       type: number
 *                       example: 19.432608
 *                     longitud:
 *                       type: number
 *                       example: -99.133209
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
 *                   example: "Error en el servidor al registrar la ubicación."
 */
const crear = async (req, res) => {
  try {
    const { nombre_ubicacion, estado, descripcion, latitud, longitud } = req.body;

    const nuevaUbicacion = await Ubicacion.create({
      nombre_ubicacion,
      estado,
      descripcion,
      latitud,
      longitud
    });

    return res.status(201).json({
      status: 'success',
      message: 'Ubicación registrada correctamente',
      data: nuevaUbicacion
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
 * /api/ubicaciones/{id}:
 *   put:
 *     summary: Actualizar una ubicación existente
 *     description: Modifica los datos de una ubicación geográfica específica registrada en el sistema.
 *     tags:
 *       - Ubicaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la ubicación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_ubicacion:
 *                 type: string
 *                 example: "Parque Central Sur"
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo]
 *                 example: "inactivo"
 *               descripcion:
 *                 type: string
 *                 example: "Ubicado cerca de la estación de bomberos"
 *               latitud:
 *                 type: number
 *                 example: 19.431201
 *               longitud:
 *                 type: number
 *                 example: -99.135402
 *     responses:
 *       200:
 *         description: Ubicación actualizada exitosamente.
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
 *                   example: "Ubicación actualizada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_ubicacion:
 *                       type: integer
 *                       example: 1
 *                     nombre_ubicacion:
 *                       type: string
 *                       example: "Parque Central Sur"
 *                     estado:
 *                       type: string
 *                       example: "inactivo"
 *                     descripcion:
 *                       type: string
 *                       example: "Ubicado cerca de la estación de bomberos"
 *                     latitud:
 *                       type: number
 *                       example: 19.431201
 *                     longitud:
 *                       type: number
 *                       example: -99.135402
 *       404:
 *         description: Ubicación no encontrada.
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
 *                   example: "No se encontró la ubicación con ID 1"
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
 *                   example: "Error en el servidor al actualizar la ubicación."
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_ubicacion, estado, descripcion, latitud, longitud } = req.body;

    const ubicacion = await Ubicacion.findByPk(id);
    if (!ubicacion) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la ubicación con ID ${id}`
      });
    }

    await ubicacion.update({
      nombre_ubicacion: nombre_ubicacion !== undefined ? nombre_ubicacion : ubicacion.nombre_ubicacion,
      estado: estado !== undefined ? estado : ubicacion.estado,
      descripcion: descripcion !== undefined ? descripcion : ubicacion.descripcion,
      latitud: latitud !== undefined ? latitud : ubicacion.latitud,
      longitud: longitud !== undefined ? longitud : ubicacion.longitud
    });

    return res.status(200).json({
      status: 'success',
      message: 'Ubicación actualizada correctamente',
      data: ubicacion
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
 * /api/ubicaciones/{id}:
 *   delete:
 *     summary: Eliminar una ubicación
 *     description: Remueve físicamente el registro de una ubicación geográfica de la base de datos, siempre y cuando no tenga dispositivos de monitoreo asociados (restricción referencial).
 *     tags:
 *       - Ubicaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la ubicación a eliminar
 *     responses:
 *       200:
 *         description: Ubicación eliminada exitosamente.
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
 *                   example: "Ubicación con ID 1 eliminada correctamente"
 *       400:
 *         description: No se puede eliminar por tener dispositivos asociados.
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
 *                   example: "No se puede eliminar la ubicación porque tiene dispositivos asociados"
 *       404:
 *         description: Ubicación no encontrada.
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
 *                   example: "No se encontró la ubicación con ID 1"
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
 *                   example: "Error en el servidor al eliminar la ubicación."
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const ubicacion = await Ubicacion.findByPk(id);

    if (!ubicacion) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró la ubicación con ID ${id}`
      });
    }

    // Validación de seguridad para evitar fallas por RESTRICT en base de datos
    const dispositivosAsociados = await Dispositivo.count({
      where: { id_ubicacion: id }
    });

    if (dispositivosAsociados > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede eliminar la ubicación porque tiene dispositivos asociados'
      });
    }

    await ubicacion.destroy();

    return res.status(200).json({
      status: 'success',
      message: `Ubicación con ID ${id} eliminada correctamente`
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
