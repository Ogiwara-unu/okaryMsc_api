import { connection } from "./dbConnection.js";
const songtb = () => connection.table('songs');

// Obtener una canción por ID
export async function getSong(id) {
  return await songtb().first().where({ id });
}

// Obtener todas las canciones (opcionalmente limitadas)
export async function getSongs(limit) {
  const query = songtb().select().orderBy('title', 'asc');
  if (limit) {
    query.limit(limit);
  }
  return query;
}

// Agregar una nueva canción
export async function addSong(songData) {
  const [id] = await songtb().insert(songData);
  const song = await getSong(id);
  return song;
}

// Actualizar una canción existente
export async function updateSong(id, songData) {
  await songtb().where({ id }).update(songData);
  return getSong(id);
}

// Eliminar una canción por ID
export async function deleteSong(id) {
  const song = await getSong(id);
  if (!song) {
    throw new Error('Canción no encontrada');
  }
  await songtb().where({ id }).del();
  return song;
}
