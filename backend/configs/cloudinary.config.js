'use strict';

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Función auxiliar para limpiar comillas y espacios accidentales agregados en Railway
const cleanEnv = (val) => (val || '').replace(/["']/g, '').trim();

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: cleanEnv(process.env.CLOUDINARY_URL),
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) || 'dodpgluzp',
    api_key: cleanEnv(process.env.CLOUDINARY_API_KEY) || '113596888817294',
    api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET) || 'Fwdwlf9ZdkcHXzaUej1jBnLcubI',
    secure: true,
  });
}

// Configurar el almacenamiento Multer apuntando a la carpeta 'atmora_perfiles' en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'atmora_perfiles',
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
  },
});

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
