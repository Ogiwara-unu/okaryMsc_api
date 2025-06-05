import { connection } from "./dbConnection.js";
const playlistSongtb = () => connection.table('playlist_songs');

// Obtener todas las canciones de una playlist
export async function getSongsByPlaylist(playlistId) {
  return await playlistSongtb()
    .select('songs.*')
    .join('songs', 'playlist_songs.song_id', 'songs.id')
    .where('playlist_songs.playlist_id', playlistId);
}

// Agregar una canción a una playlist
export async function addSongToPlaylist(playlistId, songId) {
  const entry = {
    playlist_id: playlistId,
    song_id: songId
  };
  await playlistSongtb().insert(entry);
  return entry;
}

// Quitar una canción de una playlist
export async function removeSongFromPlaylist(playlistId, songId) {
  await playlistSongtb().where({ playlist_id: playlistId, song_id: songId }).del();
  return { playlistId, songId };
}
