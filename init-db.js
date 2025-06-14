const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        email TEXT UNIQUE,
        senha TEXT,
        tipo TEXT DEFAULT 'funcionario'
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        preco NUMERIC,
        imagem TEXT,
        categoria TEXT,
        caracteristica TEXT
      )
    `);

    const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1", ["admin@site.com"]);

    if (rows.length === 0) {
      const senhaAdmin = "1234";
      const senhaCriptografada = bcrypt.hashSync(senhaAdmin, 10);
      await db.query(
        "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4)",
        ["Admin", "admin@site.com", senhaCriptografada, "lider"]
      );
      console.log("Usuário líder (admin) criado com sucesso.");
    } else {
      console.log("Usuário admin já existe.");
    }
  } catch (err) {
    console.error("Erro ao inicializar o banco:", err);
  } finally {
    await db.end();
    console.log("Conexão com o banco encerrada.");
  }
})();
