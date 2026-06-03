'use strict';

/**
 * Middleware centralizado de manejo de errores.
 * Debe ser el último middleware registrado en Express.
 *
 * @param {Error} err - Objeto de error capturado
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // Log del error en consola (en producción usar un logger como Winston)
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // ── Errores de Validación de Sequelize ─────────────────────────────────────
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación en los datos enviados',
      errors: messages,
    });
  }

  // ── Error de Clave Foránea ──────────────────────────────────────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      status: 'error',
      message: 'El recurso referenciado no existe (clave foránea inválida)',
    });
  }

  // ── Error de conexión a DB ──────────────────────────────────────────────────
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      status: 'error',
      message: 'No se pudo conectar a la base de datos. Intente más tarde.',
    });
  }

  // ── Error genérico (500 Internal Server Error) ──────────────────────────────
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
