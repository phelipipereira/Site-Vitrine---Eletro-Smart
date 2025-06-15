// init-session-table.js
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createSessionTableSQL = `
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`;

async function createSessionTable() {
  try {
    await pool.query(createSessionTableSQL);
    console.log("Tabela session criada ou já existente.");
  } catch (err) {
    console.error("Erro ao criar a tabela session:", err);
  } finally {
    await pool.end();
  }
}

createSessionTable();
