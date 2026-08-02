'use strict';

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { uploadPerfilFoto } = require('../configs/cloudinary.config');

// Middleware para manejar la carga de Multer y capturar posibles errores de formato o tamaño de archivo
const handleMulterUpload = (req, res, next) => {
  const upload = uploadPerfilFoto.single('foto');
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Error al subir la foto de perfil'
      });
    }
    next();
  });
};

// Endpoint PUT para subir/actualizar la foto de perfil en Cloudinary (debe ir antes de las rutas con :id)
router.put('/perfil/foto', handleMulterUpload, usuarioController.subirFotoPerfil);

// Definición de endpoints de usuario
router.get('/', usuarioController.obtenerTodos);
router.get('/:id', usuarioController.obtenerPorId);
router.post('/', usuarioController.crear);
router.put('/:id', usuarioController.actualizar);
router.patch('/:id', usuarioController.actualizar);
router.delete('/:id', usuarioController.eliminar);

module.exports = router;
