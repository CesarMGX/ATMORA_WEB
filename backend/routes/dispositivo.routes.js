'use strict';

const express = require('express');
const router = express.Router();
const dispositivoController = require('../controllers/dispositivo.controller');

// Definición de endpoints de dispositivo
router.get('/', dispositivoController.obtenerTodos);
router.get('/:id', dispositivoController.obtenerPorId);
router.get('/:id/ultima-lectura', dispositivoController.obtenerUltimaLectura);
router.post('/', dispositivoController.crear);
router.put('/:id', dispositivoController.actualizar);
router.delete('/:id', dispositivoController.eliminar);

module.exports = router;
