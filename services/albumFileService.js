import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configuración de Multer para álbumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './assets/img/album';
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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

export const uploadAlbumImage = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export async function saveAlbumImage(file) {
  try {
    if (!file) {
      return {
        status: 406,
        message: 'Error: no se encontró el archivo'
      };
    }

    return {
      status: 201,
      message: 'Imagen de álbum guardada',
      filename: file.filename
    };
  } catch (error) {
    console.error('Error al guardar imagen de álbum:', error);
    return {
      status: 500,
      message: 'Error interno al guardar la imagen'
    };
  }
}

export async function getAlbumImage(filename) {
  try {
    if (!filename) {
      return {
        status: 406,
        message: 'No se definió el nombre de la imagen'
      };
    }

    const imagePath = path.join('./assets/img/album', filename);
    
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
    console.error('Error al obtener imagen de álbum:', error);
    return {
      status: 500,
      message: 'Error interno al obtener la imagen'
    };
  }
}

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