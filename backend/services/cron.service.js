'use strict';

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../configs/database');

// Archivo para mantener la persistencia del conteo de registros entre reinicios del servidor
const STATE_FILE_PATH = path.join(__dirname, '../ai/mlops_state.json');

/**
 * Carga el último conteo de registros guardado en disco
 */
const cargarEstadoMLOps = () => {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('⚠️ Error al leer mlops_state.json:', error.message);
  }
  return { ultimoConteoRegistros: 0, fechaUltimoEntrenamiento: null };
};

/**
 * Guarda el nuevo conteo de registros en disco
 */
const guardarEstadoMLOps = (conteo) => {
  try {
    const estado = {
      ultimoConteoRegistros: conteo,
      fechaUltimoEntrenamiento: new Date().toISOString()
    };
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(estado, null, 2), 'utf8');
  } catch (error) {
    console.error('⚠️ Error al guardar mlops_state.json:', error.message);
  }
};

/**
 * Obtiene el total actual de registros en la tabla de historial de la base de datos
 */
const obtenerTotalRegistros = async () => {
  try {
    // Intentar primero con 'historial_sensores'
    const [resultado] = await sequelize.query('SELECT COUNT(*) AS total FROM historial_sensores;');
    return parseInt(resultado[0].total, 10) || 0;
  } catch (err1) {
    try {
      // Reintento con tabla 'historial'
      const [resultadoAlt] = await sequelize.query('SELECT COUNT(*) AS total FROM historial;');
      return parseInt(resultadoAlt[0].total, 10) || 0;
    } catch (err2) {
      console.error('❌ Error al obtener el total de registros del historial:', err2.message);
      return 0;
    }
  }
};

/**
 * Ejecuta el script de reentrenamiento en Python
 */
const ejecutarReentrenamientoPython = () => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../ai/reentrenar_modelos.py');
    const command = `python "${pythonScriptPath}"`;

    console.log(`🤖 [MLOps Cron] Ejecutando: ${command}`);

    exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (stdout) console.log(`[Python Output]:\n${stdout}`);
      if (stderr) console.warn(`[Python Stderr]:\n${stderr}`);

      if (error) {
        console.error(`❌ [MLOps Cron] Error al ejecutar el script de reentrenamiento: ${error.message}`);
        return reject(error);
      }

      console.log('✅ [MLOps Cron] Reentrenamiento de modelos completado exitosamente.');
      resolve(stdout);
    });
  });
};

/**
 * Proceso principal de verificación y reentrenamiento
 */
const verificarYReentrenar = async () => {
  console.log('\n⏰ [MLOps Cron] Verificando nuevos datos en la base de datos para entrenamiento continuo...');
  const conteoActual = await obtenerTotalRegistros();
  const estadoGuardado = cargarEstadoMLOps();
  const ultimoConteo = estadoGuardado.ultimoConteoRegistros || 0;

  console.log(`📊 Total registros actuales: ${conteoActual} | Registros día anterior: ${ultimoConteo}`);

  if (conteoActual > ultimoConteo) {
    console.log(`🚀 Nuevos registros detectados (${conteoActual} > ${ultimoConteo}). Iniciando reentrenamiento de IA...`);
    try {
      await ejecutarReentrenamientoPython();
      guardarEstadoMLOps(conteoActual);
    } catch (error) {
      console.error('❌ Falló el reentrenamiento de modelos:', error.message);
    }
  } else {
    console.log(`ℹ️ No hay registros nuevos en la base de datos (${conteoActual} <= ${ultimoConteo}). Reentrenamiento omitido.`);
  }
};

/**
 * Inicializa la tarea programada con node-cron a las 3:00 AM diariamente
 */
const iniciarCronMLOps = () => {
  // Expresión cron: '0 3 * * *' -> Todos los días a las 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    await verificarYReentrenar();
  });

  console.log('✅ Tarea programada MLOps configurada: Reentrenamiento continuo diario a las 3:00 AM (0 3 * * *)');
};

module.exports = {
  iniciarCronMLOps,
  verificarYReentrenar
};
