import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/db.sqlite3');

export const connection = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
});

connection.on('query', ({ sql, bindings }) => {
  const query = connection.raw(sql, bindings).toQuery();
  console.log('[DB]---->', query);
});
