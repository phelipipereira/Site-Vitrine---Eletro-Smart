const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database("database.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT,
    tipo TEXT DEFAULT 'funcionario' 
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    preco TEXT,
    imagem TEXT,
    categoria TEXT,
    caracteristica TEXT
  )`);

  // Cria o usuário líder (admin) com tipo 'lider'
  const senhaCriptografada = bcrypt.hashSync("1234", 10);

  db.get("SELECT * FROM usuarios WHERE email = ?", ["admin@site.com"], (err, row) => {
    if (err) {
      console.error("Erro na consulta:", err.message);
    } else if (!row) {
      db.run(
        `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`,
        ["Admin", "admin@site.com", senhaCriptografada, "lider"],
        (err) => {
          if (err) console.error("Erro ao inserir admin:", err.message);
          else console.log("Usuário líder (admin) criado com sucesso.");

          // Fecha o DB aqui, depois que tudo terminou
          db.close(() => {
            console.log("Banco de dados finalizado.");
          });
        }
      );
    } else {
      console.log("Usuário admin já existe.");

      // Fecha o DB aqui também, pois não precisa inserir
      db.close(() => {
        console.log("Banco de dados finalizado.");
      });
    }
  });
});
