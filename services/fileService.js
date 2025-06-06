import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configuración de Multer para almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './assets/img/song';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Filtro para solo aceptar imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Configuración de Multer
export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * Guarda una imagen en el servidor y devuelve el nombre del archivo
 * @param {Object} file - Objeto de archivo de Multer
 * @returns {Object} { status: number, message: string, filename?: string }
 */
export async function uploadSongImage(file) {
  try {
    if (!file) {
      return {
        status: 406,
        message: 'Error: no se encontró el archivo'
      };
    }

    return {
      status: 201,
      message: 'Imagen guardada',
      filename: file.filename
    };
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    return {
      status: 500,
      message: 'Error interno al guardar la imagen'
    };
  }
}

/**
 * Obtiene una imagen del servidor
 * @param {string} filename - Nombre del archivo a buscar
 * @returns {Object} { status: number, message?: string, file?: Buffer, contentType?: string }
 */
export async function getSongImage(filename) {
  try {
    if (!filename) {
      return {
        status: 406,
        message: 'No se definió el nombre de la imagen'
      };
    }

    const imagePath = path.join('./assets/img/song', filename);
    
    if (!fs.existsSync(imagePath)) {
      return {
        status: 404,
        message: 'Imagen no existe'
      };
    }

    const file = fs.readFileSync(imagePath);
    const contentType = getContentType(filename);

    return {
      status: 200,
      file,
      contentType
    };
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    return {
      status: 500,
      message: 'Error interno al obtener la imagen'
    };
  }
}

// Función auxiliar para determinar el tipo de contenido
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}