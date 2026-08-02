'use strict';

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary: Soporta CLOUDINARY_URL o las variables individuales
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL.trim(),
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || 'dodpgluzp').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '785771948593921').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || 'qOALpdh8ESkgOYKLWGJi6HH-lyc').trim(),
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
