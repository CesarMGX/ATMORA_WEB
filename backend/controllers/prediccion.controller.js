'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { Prediccion } = require('../models');

/**
 * @swagger
 * /api/predecir:
 *   post:
 *     summary: Realizar predicción de temperatura
 *     description: Ejecuta el modelo de regresión lineal múltiple en Python para estimar la temperatura a partir de Humedad, Presión y Radiación. Guarda el historial en PostgreSQL.
 *     tags:
 *       - Predicciones
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
 *         description: Predicción realizada y guardada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_prediccion:
 *                       type: integer
 *                       example: 1
 *                     humedad:
 *                       type: number
 *                       example: 65.5
 *                     presion:
 *                       type: number
 *                       example: 1013.25
 *                     radiacion:
 *                       type: number
 *                       example: 850.0
 *                     temperatura_predicha:
 *                       type: number
 *                       example: 24.53
 *                     fecha_hora:
 *                       type: string
 *                       example: "2026-06-09T03:10:46Z"
 *       400:
 *         description: Datos de entrada inválidos o faltantes.
 *       500:
 *         description: Error en la predicción o base de datos.
 */
const predecirTemperatura = async (req, res) => {
  const { humedad, presion, radiacion } = req.body;

  // 1. Validaciones preventivas
  if (humedad === undefined || presion === undefined || radiacion === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros humedad, presion y radiacion son requeridos en el cuerpo de la petición (req.body).'
    });
  }

  const h = parseFloat(humedad);
  const p = parseFloat(presion);
  const r = parseFloat(radiacion);

  if (isNaN(h) || isNaN(p) || isNaN(r)) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros humedad, presion y radiacion deben ser numéricos.'
    });
  }

  // 2. Definir la ruta del script de predicción en Python
  const scriptPath = path.join(__dirname, '../ai/predict.py');

  // Determinar comando de python adecuado para Windows/Linux/Docker
  const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

  // 3. Ejecutar el script utilizando spawn
  const pythonProcess = spawn(pythonCmd, [scriptPath, h.toString(), p.toString(), r.toString()]);

  let stdoutData = '';
  let stderrData = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pythonProcess.on('close', async (code) => {
    if (code !== 0) {
      console.error(`Error en el proceso de Python (Código ${code}):`, stderrData);
      return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor al realizar la predicción de temperatura.',
        details: stderrData.trim()
      });
    }

    try {
      const temperaturaPredicha = parseFloat(stdoutData.trim());
      if (isNaN(temperaturaPredicha)) {
        throw new Error('La respuesta del script de predicción no es un número válido.');
      }

      // 4. Guardar la predicción en la base de datos PostgreSQL mediante el ORM Sequelize
      const nuevaPrediccion = await Prediccion.create({
        humedad: h,
        presion: p,
        radiacion: r,
        temperatura_predicha: temperaturaPredicha
      });

      return res.status(200).json({
        status: 'success',
        data: nuevaPrediccion
      });

    } catch (dbError) {
      console.error('Error al procesar el resultado o guardar en BD:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Error al almacenar el historial de predicción en la base de datos.',
        details: dbError.message
      });
    }
  });
};

module.exports = {
  predecirTemperatura
};
