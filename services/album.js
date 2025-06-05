import { connection } from "./dbConnection.js";
const albumtb = () => connection.table('albums');

// Obtener un álbum por ID
export async function getAlbum(id) {
  return await albumtb().first().where({ id });
}

// Obtener todos los álbumes (opcionalmente limitados)
export async function getAlbums(limit) {
  const query = albumtb().select().orderBy('title', 'asc');
  if (limit) {
    query.limit(limit);
  }
  return query;
}

// Agregar un nuevo álbum
export async function addAlbum(albumData) {
  const [id] = await albumtb().insert(albumData);
  const album = await getAlbum(id);
  return album;
}


// Actualizar un álbum existente
export async function updateAlbum(id, albumData) {
  await albumtb().where({ id }).update(albumData);
  return getAlbum(id);
}

// Eliminar un álbum por ID
export async function deleteAlbum(id) {
  const album = await getAlbum(id);
  if (!album) {
    throw new Error('Álbum no encontrado');
  }
  await albumtb().where({ id }).del();
  return album;
}

