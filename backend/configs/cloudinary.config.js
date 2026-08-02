'use strict';

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Función auxiliar para limpiar comillas y espacios de Railway
const cleanEnv = (val) => (val || '').replace(/["']/g, '').trim();

const cloudinaryUrl = cleanEnv(process.env.CLOUDINARY_URL);

if (cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) || 'dodpgiuzp',
    api_key: cleanEnv(process.env.CLOUDINARY_API_KEY) || '113596888817294',
    api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET) || 'Fwdwlf9ZdkcHXzaUej1jBnLcubI',
    secure: true,
  });
}

// Configurar almacenamiento Multer en Memoria para convertir a Data URI
const storage = multer.memoryStorage();

// Middleware Multer con límite de peso de 5MB y filtro de formato
const uploadPerfilFoto = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no válido. Solo se permiten imágenes PNG, JPG, JPEG o WEBP.'), false);
    }
  },
});

module.exports = {
  cloudinary,
  uploadPerfilFoto,
};
