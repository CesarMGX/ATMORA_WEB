'use strict';

const express = require('express');
const router = express.Router();
const prediccionController = require('../controllers/prediccion.controller');

// Definición de endpoint de predicción
router.post('/', prediccionController.predecirTemperatura);

module.exports = router;
