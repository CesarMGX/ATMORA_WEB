'use strict';

const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacion.controller');

// Definición de endpoints de ubicación
router.get('/', ubicacionController.obtenerTodos);
router.get('/:id', ubicacionController.obtenerPorId);
router.post('/', ubicacionController.crear);
router.put('/:id', ubicacionController.actualizar);
router.delete('/:id', ubicacionController.eliminar);

module.exports = router;
