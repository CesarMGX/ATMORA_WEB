'use strict';

const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alerta.controller');

// Definición de endpoints de alerta
router.get('/', alertaController.obtenerTodos);
router.get('/:id', alertaController.obtenerPorId);
router.post('/', alertaController.crear);
router.put('/:id', alertaController.actualizar);
router.delete('/:id', alertaController.eliminar);

module.exports = router;
