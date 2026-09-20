'use strict';

const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller');

/**
 * @swagger
 * /api/pagos/crear-suscripcion:
 *   post:
 *     summary: Crear preferencia o link de pago para la suscripción Atmora PRO ($39 MXN/mes)
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 1
 *               email:
 *                 type: string
 *                 example: usuario@ejemplo.com
 *     responses:
 *       200:
 *         description: Link de pago generado correctamente
 *       400:
 *         description: Datos requeridos faltantes
 */
router.post('/crear-suscripcion', pagoController.crearSuscripcion);

/**
 * @swagger
 * /api/pagos/confirmar-exito:
 *   post:
 *     summary: Confirmar y activar la suscripción PRO_MENSUAL al retornar exitosamente del checkout
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Suscripción activada correctamente
 */
router.post('/confirmar-exito', pagoController.confirmarExito);
router.post('/cancelar-suscripcion', pagoController.cancelarSuscripcion);

/**
 * @swagger
 * /api/pagos/webhook:
 *   post:
 *     summary: Recibir notificaciones IPN / Webhooks de Mercado Pago
 *     tags: [Pagos]
 *     responses:
 *       200:
 *         description: Notificación recibida y procesada correctamente
 */
router.post('/webhook', pagoController.webhook);

module.exports = router;
