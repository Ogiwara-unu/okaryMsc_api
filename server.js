import { ApolloServer } from "@apollo/server";
import { expressMiddleware as middleware } from "@apollo/server/express4";
import express from 'express';
import cors from 'cors';
import { resolvers } from './resolver.js';
import { createServer as createHttpServer } from 'node:http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFile } from "node:fs/promises";
import { authMiddleware, getToken, decodeToken } from "./auth.js";
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { uploadAlbumImage, saveAlbumImage } from './services/albumFileService.js';

const PORT = 9001;
const app = express();

// 1. Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'assets', 'img', 'song');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middlewares
app.use(cors({
  origin: 'http://localhost:4200', // o tu URL de frontend
  credentials: true
}));
app.use(express.json());
app.use(authMiddleware);

// 2. Ruta para servir imágenes estáticas
app.use('/images/songs', express.static(path.join(process.cwd(), 'assets', 'img', 'song')));
app.use('/images/albums', express.static(path.join(process.cwd(), 'assets', 'img', 'album')));


// 3. Ruta REST para prueba de subida de imágenes 
app.post('/api/upload-song-image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.json({
    filename: req.file.filename,
    url: `/images/songs/${req.file.filename}`
  });
});

// 4. Ruta REST para subir imágenes de álbumes
app.post('/api/upload-album-image', uploadAlbumImage.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.json({
    filename: req.file.filename,
    url: `/images/albums/${req.file.filename}`
  });
});

// Resto de tu configuración existente
app.post('/login', express.json(), async (req, res) => {
  try {
    await getToken(req, res);
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

const typeDefs = await readFile('./schema.graphql', 'utf8');
const graphSchema = makeExecutableSchema({ typeDefs, resolvers });

const graphServer = new ApolloServer({ schema: graphSchema });
await graphServer.start();

const httpServer = createHttpServer(app);

async function getContext({ req }) {
    return { auth: req.auth };
}

/** Manejo del WebSocket */
async function getWsContext({ connectionParams }) {
    const accessToken = connectionParams?.accessToken;
    if (accessToken) {
        const payload = await decodeToken(accessToken);
        return { user: payload };
    }
    return {};
}

const wsServer = new WebSocketServer({ server: httpServer, path: '/okaryMsc' });
useServer({ schema: graphSchema, context: getWsContext }, wsServer);

app.use('/okaryMsc', middleware(graphServer, { context: getContext }));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    } else if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

httpServer.listen({ port: PORT }, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}/okaryMsc`);
    console.log(`Ruta de imágenes: http://localhost:${PORT}/images/songs`);
    console.log(`Ruta de imágenes álbumes: http://localhost:${PORT}/images/albums`);
});