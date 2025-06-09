import { GraphQLError } from "graphql";
import { encryptPassword } from "./utils/encryption.js";
import {
  getSong,
  getSongs,
  addSong,
  updateSong,
  deleteSong
} from "./services/song.js";

import {
  getPlaylist,
  getPlaylists,
  addPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistsByUserId
} from "./services/playlist.js";

import {
  getAlbum,
  getAlbums,
  addAlbum,
  updateAlbum,
  deleteAlbum
} from "./services/album.js";

import {
  addSongToPlaylist,
  removeSongFromPlaylist,
  getSongsByPlaylist
} from "./services/playlistSong.js";
import { get } from "http";

import {
  getUser,
  getUsers,
  addUser,
  getUserByEmail,
  updateUser,
  deleteUser
} from "./services/user.js";

import { requireAuth } from "./helper/requireAuth.js";
import { uploadSongImage, getSongImage } from './services/fileService.js';
import { saveAlbumImage, getAlbumImage } from './services/albumFileService.js';

export const resolvers = {
  Query: {
    // Canciones
    cancion: async (_root, { id }) => {
      const song = await getSong(id);
      if (!song) {
        throw new GraphQLError("Canción no encontrada", {
          extensions: { code: "NOT_FOUND" }
        });
      }
      return song;
    },
    canciones: async (_root, { limit }) => {
      const items = await getSongs(limit);
      return { items };
    },

    getSongImage: async (_root, { filename }) => {
      const result = await getSongImage(filename);

      if (result.status !== 200) {
        throw new GraphQLError(result.message, {
          extensions: { code: result.status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR" }
        });
      }

      return {
        file: result.file.toString('base64'),
        contentType: result.contentType
      };
    },

    // Playlists
    playlist: async (_root, { id }) => {
      const playlist = await getPlaylist(id);
      if (!playlist) {
        throw new GraphQLError("Playlist no encontrada", {
          extensions: { code: "NOT_FOUND" }
        });
      }
      return playlist;
    },
    playlists: async (_root, { limit }) => {
      const items = await getPlaylists(limit);
      return { items };
    },
    playlistsByUser: async (_root, { userId }) => {
      const playlists = await getPlaylistsByUserId(userId);
      return playlists;
    },

    // Álbumes
    album: async (_root, { id }) => {
      const album = await getAlbum(id);
      if (!album) {
        throw new GraphQLError("Álbum no encontrado", {
          extensions: { code: "NOT_FOUND" }
        });
      }
      return album;
    },
    albums: async (_root, { limit }) => {
      const items = await getAlbums(limit);
      return { items };
    },
    getAlbumImage: async (_root, { filename }) => {
      const result = await getAlbumImage(filename);

      if (result.status !== 200) {
        throw new GraphQLError(result.message, {
          extensions: { code: result.status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR" }
        });
      }

      return {
        file: result.file.toString('base64'),
        contentType: result.contentType
      };
    },

    // Usuarios
    usuario: async (_root, { id }) => {
      const user = await getUser(id);
      if (!user) {
        throw new GraphQLError("Usuario no encontrado", {
          extensions: { code: "NOT_FOUND" }
        });
      }
      return user;
    },
    usuarios: async (_root, { limit }) => {
      const items = await getUsers(limit);
      return { items };
    }
  },

  Playlist: {
    canciones: async (playlist) => {
      const items = await getSongsByPlaylist(playlist.id);
      return items;
    },
    user: async (playlist) => {
      if (!playlist.user_id) return null;
      return await getUser(playlist.user_id);
    },
  },


  Mutation: {
    // Canciones
    crearCancion: async (_root, { input }, context) => {
      requireAuth(context, ['admin']);
      try {
        const song = await addSong(input);
        return song;
      } catch (error) {
        throw new GraphQLError("Error al crear la canción", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    actualizarCancion: async (_root, { id, input }, context) => {
      requireAuth(context, ['admin']);
      try {
        const song = await updateSong(id, input);
        return song;
      } catch (error) {
        throw new GraphQLError("Error al actualizar la canción", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    eliminarCancion: async (_root, { id }, context) => {
      requireAuth(context, ['admin']);
      try {
        const song = await deleteSong(id);
        return song;
      } catch (error) {
        throw new GraphQLError("Error al eliminar la canción", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },

    /**
     * Sube una imagen para una canción
     */
    uploadSongImage: async (_root, { file }, context) => {
      requireAuth(context, ['admin']);

      try {
        const { createReadStream, filename, mimetype } = await file;
        const stream = createReadStream();

        // Guardar el archivo temporalmente
        const filePath = `/tmp/${uuidv4()}-${filename}`;
        await new Promise((resolve, reject) =>
          stream
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject)
        );

        // Procesar el archivo
        const result = await uploadSongImage({
          path: filePath,
          originalname: filename,
          mimetype
        });

        // Eliminar el archivo temporal
        fs.unlinkSync(filePath);

        if (result.status !== 201) {
          throw new GraphQLError(result.message, {
            extensions: { code: "UPLOAD_ERROR" }
          });
        }

        return {
          filename: result.filename,
          url: `/images/songs/${result.filename}`
        };
      } catch (error) {
        throw new GraphQLError("Error al subir la imagen", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },


    // Playlists
    crearPlaylist: async (_root, { input }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const playlist = await addPlaylist(input);
        return playlist;
      } catch (error) {
        throw new GraphQLError("Error al crear la playlist", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    actualizarPlaylist: async (_root, { id, input }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const playlist = await updatePlaylist(id, input);
        return playlist;
      } catch (error) {
        throw new GraphQLError("Error al actualizar la playlist", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    eliminarPlaylist: async (_root, { id }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const playlist = await deletePlaylist(id);
        return playlist;
      } catch (error) {
        throw new GraphQLError("Error al eliminar la playlist", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    agregarCancionAPlaylist: async (_root, { playlistId, songId }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        await addSongToPlaylist(playlistId, songId);
        const playlist = await getPlaylist(playlistId);
        return playlist;
      } catch (error) {
        throw new GraphQLError("Error al agregar la canción a la playlist", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    quitarCancionDePlaylist: async (_root, { playlistId, songId }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        await removeSongFromPlaylist(playlistId, songId);
        const playlist = await getPlaylist(playlistId);
        return playlist;
      } catch (error) {
        throw new GraphQLError("Error al quitar la canción de la playlist", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },

    // Álbumes
    crearAlbum: async (_root, { input }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const album = await addAlbum(input);
        return album;
      } catch (error) {
        throw new GraphQLError("Error al crear el álbum", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    actualizarAlbum: async (_root, { id, input }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const album = await updateAlbum(id, input);
        return album;
      } catch (error) {
        throw new GraphQLError("Error al actualizar el álbum", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },
    eliminarAlbum: async (_root, { id }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const album = await deleteAlbum(id);
        return album;
      } catch (error) {
        throw new GraphQLError("Error al eliminar el álbum", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },

    uploadAlbumImage: async (_root, { file }, context) => {
      requireAuth(context, ['admin', 'user']);

      try {
        const { createReadStream, filename, mimetype } = await file;
        const stream = createReadStream();

        const filePath = `/tmp/${uuidv4()}-${filename}`;
        await new Promise((resolve, reject) =>
          stream
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject)
        );

        const result = await saveAlbumImage({
          path: filePath,
          originalname: filename,
          mimetype
        });

        fs.unlinkSync(filePath);

        if (result.status !== 201) {
          throw new GraphQLError(result.message, {
            extensions: { code: "UPLOAD_ERROR" }
          });
        }

        return {
          filename: result.filename,
          url: `/images/albums/${result.filename}`
        };
      } catch (error) {
        throw new GraphQLError("Error al subir la imagen del álbum", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },

    // Usuarios
    crearUsuario: async (_root, { input }) => {
      try {
        console.log("Datos recibidos:", input);
        const hashedPassword = await encryptPassword(input.password);
        console.log("Contraseña hasheada:", hashedPassword);

        const newUser = await addUser({
          username: input.username,
          email: input.email,
          password: hashedPassword,
          role: input.role || "user"
        });

        console.log("Usuario creado:", newUser);
        return newUser;
      } catch (error) {
        console.error("Error detallado al crear usuario:", error);
        throw new GraphQLError("Error al crear el usuario: " + error.message, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            details: error.stack
          }
        });
      }
    },

    actualizarUsuario: async (_root, { id, input }, context) => {
      requireAuth(context, ['admin', 'user']);
      try {
        const user = await updateUser(id, input);
        return user;
      } catch (error) {
        throw new GraphQLError("Error al actualizar el usuario", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    },

    eliminarUsuario: async (_root, { id }, context) => {
      requireAuth(context, ['admin']);
      try {
        const user = await deleteUser(id);
        return user;
      } catch (error) {
        throw new GraphQLError("Error al eliminar el usuario", {
          extensions: { code: "INTERNAL_SERVER_ERROR", details: error.message }
        });
      }
    }
  }
};
