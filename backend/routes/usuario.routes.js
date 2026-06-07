'use strict';

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Definición de endpoints de usuario
router.get('/', usuarioController.obtenerTodos);
router.get('/:id', usuarioController.obtenerPorId);
router.post('/', usuarioController.crear);
router.put('/:id', usuarioController.actualizar);
router.patch('/:id', usuarioController.actualizar);
router.delete('/:id', usuarioController.eliminar);

module.exports = router;
