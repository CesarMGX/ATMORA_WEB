'use strict';

const express = require('express');
const router = express.Router();
const iaController = require('../controllers/ia.controller');

// Endpoints de IA basada en sensores en tiempo real
router.post('/validar-temperatura', iaController.validarTemperatura);
router.post('/clasificar-entorno', iaController.clasificarEntorno);

module.exports = router;
