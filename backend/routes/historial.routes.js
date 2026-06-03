'use strict';

const { Router } = require('express');
const {
  getHistoriales,
  getHistorialById,
  createHistorial,
  updateHistorial,
  deleteHistorial,
} = require('../controllers/historial.controller');

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SWAGGER JSDoc - Documentación de endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Historial
 *   description: Gestión del historial de lecturas de sensores ambientales
 */

/**
 * @swagger
 * /api/historial:
 *   get:
 *     summary: Obtiene el historial paginado de lecturas de sensores
 *     tags: [Historial]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de registros por página
 *       - in: query
 *         name: id_dispositivo
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de dispositivo
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio del rango (ISO 8601)
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin del rango (ISO 8601)
 *     responses:
 *       200:
 *         description: Lista paginada de lecturas de sensores
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HistorialSensor'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getHistoriales);

/**
 * @swagger
 * /api/historial/{id}:
 *   get:
 *     summary: Obtiene una lectura de sensor por su ID
 *     tags: [Historial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de historial
 *     responses:
 *       200:
 *         description: Lectura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/HistorialSensor'
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getHistorialById);

/**
 * @swagger
 * /api/historial:
 *   post:
 *     summary: Registra una nueva lectura de sensor ambiental
 *     tags: [Historial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HistorialSensorInput'
 *     responses:
 *       201:
 *         description: Lectura registrada exitosamente
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
 *                   example: Lectura de sensor registrada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/HistorialSensor'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: El dispositivo especificado no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createHistorial);

/**
 * @swagger
 * /api/historial/{id}:
 *   put:
 *     summary: Actualiza una lectura de sensor existente
 *     tags: [Historial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HistorialSensorInput'
 *     responses:
 *       200:
 *         description: Lectura actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/HistorialSensor'
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateHistorial);

/**
 * @swagger
 * /api/historial/{id}:
 *   delete:
 *     summary: Elimina una lectura de sensor por su ID
 *     tags: [Historial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro a eliminar
 *     responses:
 *       200:
 *         description: Lectura eliminada correctamente
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
 *                   example: Lectura con ID 5 eliminada correctamente
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteHistorial);

module.exports = router;
