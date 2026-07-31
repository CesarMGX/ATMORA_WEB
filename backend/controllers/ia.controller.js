'use strict';

const { spawn } = require('child_process');
const path = require('path');

/**
 * Función auxiliar para ejecutar el script predict_sensores.py con datos de sensores en tiempo real
 */
const ejecutarModeloSensores = (req, res, algoritmo) => {
  const { humedad, presion, radiacion } = req.body;

  if (humedad === undefined || presion === undefined || radiacion === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros humedad, presion y radiacion son obligatorios en el cuerpo de la petición (req.body).'
    });
  }

  const h = parseFloat(humedad);
  const p = parseFloat(presion);
  const r = parseFloat(radiacion);

  if (isNaN(h) || isNaN(p) || isNaN(r)) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros humedad, presion y radiacion deben ser valores numéricos.'
    });
  }

  const scriptPath = path.join(__dirname, '../ai/predict_sensores.py');
  const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

  const pythonProcess = spawn(pythonCmd, [
    scriptPath,
    h.toString(),
    p.toString(),
    r.toString(),
    algoritmo
  ]);

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
      console.error(`Error en proceso de Python (${algoritmo}):`, stderrData);
      return res.status(500).json({
        status: 'error',
        message: `Error interno al ejecutar el modelo de ${algoritmo}.`,
        details: stderrData.trim()
      });
    }

    try {
      const resultadoJson = JSON.parse(stdoutData.trim());
      return res.status(200).json(resultadoJson);
    } catch (parseError) {
      console.error(`Error al parsear JSON (${algoritmo}):`, stdoutData);
      return res.status(500).json({
        status: 'error',
        message: `Respuesta con formato no válido obtenida del modelo (${algoritmo}).`,
        details: stdoutData.trim()
      });
    }
  });
};

/**
 * @swagger
 * /api/ia/validar-temperatura:
 *   post:
 *     summary: Validar y Predecir Temperatura basada en Sensores (Regresión Lineal)
 *     description: Ejecuta el modelo de Regresión Lineal en Python a partir de las lecturas en tiempo real de Humedad, Presión y Radiación Solar.
 *     tags:
 *       - IA & Sensores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - humedad
 *               - presion
 *               - radiacion
 *             properties:
 *               humedad:
 *                 type: number
 *                 example: 65.5
 *               presion:
 *                 type: number
 *                 example: 1013.25
 *               radiacion:
 *                 type: number
 *                 example: 850.0
 *     responses:
 *       200:
 *         description: Predicción de temperatura realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temperatura_predicha:
 *                   type: number
 *                   example: 31.96
 *       400:
 *         description: Parámetros inválidos o faltantes.
 *       500:
 *         description: Error interno al ejecutar el modelo de regresión.
 */
const validarTemperatura = (req, res) => {
  ejecutarModeloSensores(req, res, 'regresion');
};

/**
 * @swagger
 * /api/ia/clasificar-entorno:
 *   post:
 *     summary: Clasificar Entorno Climático (K-Means Clustering)
 *     description: Clasifica el entorno actual en un grupo o cluster (0, 1 o 2) utilizando el algoritmo K-Means basado en las lecturas de Humedad, Presión y Radiación Solar.
 *     tags:
 *       - IA & Sensores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - humedad
 *               - presion
 *               - radiacion
 *             properties:
 *               humedad:
 *                 type: number
 *                 example: 65.5
 *               presion:
 *                 type: number
 *                 example: 1013.25
 *               radiacion:
 *                 type: number
 *                 example: 850.0
 *     responses:
 *       200:
 *         description: Clasificación de entorno realizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 grupo:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Parámetros inválidos o faltantes.
 *       500:
 *         description: Error interno al ejecutar la clasificación K-Means.
 */
const clasificarEntorno = (req, res) => {
  ejecutarModeloSensores(req, res, 'kmeans');
};

module.exports = {
  validarTemperatura,
  clasificarEntorno
};
