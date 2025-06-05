import { connection } from "./dbConnection.js";
const playlisttb = () => connection.table('playlists');

// Obtener una playlist por ID
export async function getPlaylist(id) {
  return await playlisttb().first().where({ id });
}

// Obtener todas las playlists (opcionalmente limitadas)
export async function getPlaylists(limit) {
  const query = playlisttb().select().orderBy('name', 'asc');
  if (limit) {
    query.limit(limit);
  }
  return query;
}

// Agregar una nueva playlist
export async function addPlaylist(playlistData) {
  const { name, description, userId } = playlistData;
  if (!userId) {
    throw new Error("El campo 'userId' es obligatorio.");
  }

  const [id] = await playlisttb().insert({
    name,
    description,
    user_id: userId
  });

  return await getPlaylist(id);
}

// Obtener todas las playlists de un usuario específico
export async function getPlaylistsByUserId(userId) {
  return await connection('playlists').where({ user_id: userId });
}



// Actualizar una playlist existente
export async function updatePlaylist(id, playlistData) {
  await playlisttb().where({ id }).update(playlistData);
  return getPlaylist(id);
}

// Eliminar una playlist por ID
export async function deletePlaylist(id) {
  const playlist = await getPlaylist(id);
  if (!playlist) {
    throw new Error('Playlist no encontrada');
  }
  await playlisttb().where({ id }).del();
  return playlist;  
}
