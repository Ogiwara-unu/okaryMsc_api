import { connection } from "../services/dbConnection.js";
const { schema } = connection;

// This script is used to reset the database schema for a music application.
await schema.dropTableIfExists('playlist_songs');
await schema.dropTableIfExists('playlists');
await schema.dropTableIfExists('songs');
await schema.dropTableIfExists('albums');
await schema.dropTableIfExists('users');

// USERS
await schema.createTable('users', (table) => {
  table.increments('id').primary().notNullable();
  table.string('username', 100).notNullable().unique();
  table.string('email', 100).notNullable().unique();
  table.string('password', 255).notNullable();
  table.string('role', 50).defaultTo('user');
});

// ALBUMS
await schema.createTable('albums', (table) => {
  table.increments('id').primary().notNullable();
  table.string('title', 255).notNullable();
  table.string('artist', 255).notNullable();
  table.integer('year');
  table.string('genre', 100);
  table.string('photo', 500);
});

// SONGS
await schema.createTable('songs', (table) => {
  table.increments('id').primary().notNullable();
  table.string('title', 255).notNullable();
  table.string('artist', 255).notNullable();
  table.string('album', 255);
  table.string('genre', 100);
  table.integer('duration');
  table.text('lyrics');
  table.string('photo', 500);
});

// PLAYLISTS
await schema.createTable('playlists', (table) => {
  table.increments('id').primary().notNullable();
  table.string('name', 255).notNullable();
  table.text('description');
  table.integer('user_id').unsigned().references('id').inTable('users');
});

// PLAYLIST_SONGS
await schema.createTable('playlist_songs', (table) => {
  table.increments('id').primary().notNullable();
  table.integer('playlist_id').unsigned().notNullable().references('id').inTable('playlists');
  table.integer('song_id').unsigned().notNullable().references('id').inTable('songs');
});

process.exit();
