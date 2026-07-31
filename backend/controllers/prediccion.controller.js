'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { Prediccion } = require('../models');

/**
 * Función auxiliar para ejecutar el script predict_movil.py según la fecha y el tipo de predicción
 */
const ejecutarModeloMovil = (req, res, tipo) => {
  const { fecha } = req.body;

  if (!fecha || typeof fecha !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'El campo fecha es obligatorio en el cuerpo de la petición (formato YYYY-MM-DD).'
    });
  }

  // Validar formato YYYY-MM-DD
  const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!regexFecha.test(fecha.trim())) {
    return res.status(400).json({
      status: 'error',
      message: 'La fecha proporcionada debe tener el formato válido YYYY-MM-DD (ejemplo: 2026-07-28).'
    });
  }

  // Extraer mes y día numéricos
  const partes = fecha.trim().split('-');
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);

  if (isNaN(mes) || mes < 1 || mes > 12 || isNaN(dia) || dia < 1 || dia > 31) {
    return res.status(400).json({
      status: 'error',
      message: 'La fecha ingresada contiene valores fuera de rango para Mes (1-12) o Día (1-31).'
    });
  }

  // Ruta al script de Python
  const scriptPath = path.join(__dirname, '../ai/predict_movil.py');
  const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

  // Ejecutar script con argumentos: [Mes, Dia, Tipo]
  const pythonProcess = spawn(pythonCmd, [scriptPath, mes.toString(), dia.toString(), tipo]);

  let stdoutData = '';
  let stderrData = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Error en el proceso de Python (${tipo}):`, stderrData);
      return res.status(500).json({
        status: 'error',
        message: `Error al realizar la predicción de ${tipo}.`,
        details: stderrData.trim()
      });
    }

    try {
      const resultadoJson = JSON.parse(stdoutData.trim());
      return res.status(200).json(resultadoJson);
    } catch (parseError) {
      console.error(`Error al parsear respuesta JSON (${tipo}):`, stdoutData);
      return res.status(500).json({
        status: 'error',
        message: `Respuesta con formato no válido obtenida del modelo de ${tipo}.`,
        details: stdoutData.trim()
      });
    }
  });
};



/**
 * @swagger
 * /api/predecir/humedad:
 *   post:
 *     summary: Predicción de Humedad por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar el porcentaje de humedad a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-28"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 74.31
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirHumedad = (req, res) => {
  ejecutarModeloMovil(req, res, 'humedad');
};

/**
 * @swagger
 * /api/predecir/radiacion:
 *   post:
 *     summary: Predicción de Radiación Solar por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la radiación solar a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-28"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 620.55
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirRadiacion = (req, res) => {
  ejecutarModeloMovil(req, res, 'radiacion');
};

/**
 * @swagger
 * /api/predecir/viento:
 *   post:
 *     summary: Predicción de Velocidad del Viento por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la velocidad del viento a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-28"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 14.82
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirViento = (req, res) => {
  ejecutarModeloMovil(req, res, 'viento');
};

/**
 * @swagger
 * /api/predecir/presion:
 *   post:
 *     summary: Predicción de Presión Atmosférica por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la presión atmosférica a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-28"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 1012.45
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirPresion = (req, res) => {
  ejecutarModeloMovil(req, res, 'presion');
};

/**
 * @swagger
 * /api/predecir/co:
 *   post:
 *     summary: Predicción de Monóxido de Carbono (CO) por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la concentración de Monóxido de Carbono (CO en ppm) a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-31"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 0.48
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirCO = (req, res) => {
  ejecutarModeloMovil(req, res, 'co');
};

/**
 * @swagger
 * /api/predecir/co2:
 *   post:
 *     summary: Predicción de Dióxido de Carbono (CO2) por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la concentración de Dióxido de Carbono (CO2 en ppm) a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-31"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 410.14
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirCO2 = (req, res) => {
  ejecutarModeloMovil(req, res, 'co2');
};

/**
 * @swagger
 * /api/predecir/temperatura:
 *   post:
 *     summary: Predicción de Temperatura Ambiental por Fecha
 *     description: Ejecuta el modelo Random Forest en Python para estimar la Temperatura Ambiental (°C) a partir del Mes y Día extraídos de la fecha ingresada.
 *     tags:
 *       - Predicciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-31"
 *     responses:
 *       200:
 *         description: Predicción realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: number
 *                   example: 24.8
 *       400:
 *         description: Fecha no proporcionada o formato inválido.
 *       500:
 *         description: Error interno al ejecutar el modelo de predicción.
 */
const predecirTemperaturaFecha = (req, res) => {
  ejecutarModeloMovil(req, res, 'temperatura');
};

module.exports = {
  predecirHumedad,
  predecirRadiacion,
  predecirViento,
  predecirPresion,
  predecirCO,
  predecirCO2,
  predecirTemperaturaFecha
};
