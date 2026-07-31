'use strict';

const express = require('express');
const router = express.Router();
const prediccionController = require('../controllers/prediccion.controller');

// Endpoint general de predicción de temperatura basada en sensores
router.post('/', prediccionController.predecirTemperatura);

// Endpoints individuales de predicción por tipo y fecha (Random Forest)
router.post('/humedad', prediccionController.predecirHumedad);
router.post('/radiacion', prediccionController.predecirRadiacion);
router.post('/viento', prediccionController.predecirViento);
router.post('/presion', prediccionController.predecirPresion);
router.post('/co', prediccionController.predecirCO);
router.post('/co2', prediccionController.predecirCO2);
router.post('/temperatura', prediccionController.predecirTemperaturaFecha);

module.exports = router;
