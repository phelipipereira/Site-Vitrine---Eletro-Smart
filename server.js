// Adaptado para PostgreSQL
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");
const multer = require("multer");

const app = express();
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "homepage", "HomePage.html"));
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/assets"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(session({
    store: new pgSession({
    pool: db,                
    tableName: 'session'     
  }),
  secret: "segredo_muito_forte_aqui",
  resave: false,
  saveUninitialized: false
}));

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await db.query("SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = $1", [email]);
    const user = result.rows[0];

    if (user && bcrypt.compareSync(senha, user.senha) && ["funcionario", "lider"].includes(user.tipo)) {
      req.session.userId = user.id;
      req.session.userTipo = user.tipo;
      res.redirect("/painel/Painel.html");
    } else {
      res.send("Login inválido ou sem permissão.");
    }
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).send("Erro no servidor.");
  }
});


function autenticarFuncionario(req, res, next) {
  if (!req.session.userId) return res.redirect("/Login/Login.html");
  db.query("SELECT * FROM usuarios WHERE id = $1", [req.session.userId])
    .then(result => {
      const user = result.rows[0];
      if (!user || !["funcionario", "lider"].includes(user.tipo)) return res.redirect("/Login/Login.html");
      req.user = user;
      next();
    })
    .catch(() => res.redirect("/Login/Login.html"));
}


function autenticarLider(req, res, next) {
  if (!req.session.userId) return res.status(401).send("Não autenticado");
  db.query("SELECT * FROM usuarios WHERE id = $1", [req.session.userId])
    .then(result => {
      const user = result.rows[0];
      if (!user || user.tipo !== "lider") return res.status(403).send("Acesso negado");
      req.user = user;
      next();
    })
    .catch(() => res.status(403).send("Acesso negado"));
}


app.get("/painel", autenticarFuncionario, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Painel", "painel.html"));
});

app.get("/api/produtos", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM produtos");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get("/api/produtos/:id", autenticarFuncionario, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM produtos WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/api/produtos", autenticarFuncionario, upload.single("imagem"), async (req, res) => {
  const { nome, preco, categoria, caracteristica } = req.body;
  const imagem = req.file ? "/assets/" + req.file.filename : "";
  const precoConvertido = parseFloat(preco);
  try {
    await db.query(
      "INSERT INTO produtos (nome, preco, imagem, categoria, caracteristica) VALUES ($1, $2, $3, $4, $5)",
      [nome, precoConvertido, imagem, categoria, caracteristica]
    );
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.put("/api/produtos/:id", autenticarFuncionario, upload.single("imagem"), async (req, res) => {
  const { nome, preco, categoria, caracteristica } = req.body;

  const imagem = req.file ? "/assets/" + req.file.filename : null;
  const precoConvertido = parseFloat(preco);
  try {
    if (imagem) {
      await db.query(
        "UPDATE produtos SET nome = $1, preco = $2, imagem = $3, categoria = $4, caracteristica = $5 WHERE id = $6",
        [nome, precoConvertido, imagem, categoria, caracteristica, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE produtos SET nome = $1, preco = $2, categoria = $3, caracteristica = $4 WHERE id = $5",
        [nome, precoConvertido, categoria, caracteristica, req.params.id]
      );
    }
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.delete("/api/produtos/:id", autenticarFuncionario, async (req, res) => {
  try {
    await db.query("DELETE FROM produtos WHERE id = $1", [req.params.id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/api/usuarios", autenticarLider, async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const senhaCriptografada = bcrypt.hashSync(senha, 10);
  try {
    await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4)",
      [nome, email, senhaCriptografada, tipo]
    );
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.delete("/api/usuarios/:id", autenticarLider, async (req, res) => {
  try {
    const result = await db.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ sucesso: false, erro: "Usuário não encontrado" });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get("/api/usuario-logado", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: "Não autenticado" });
  try {
    const result = await db.query("SELECT id, nome, email, tipo FROM usuarios WHERE id = $1", [req.session.userId]);
    if (!result.rows.length) return res.status(500).json({ erro: "Erro ao buscar usuário logado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.put("/api/usuarios/:id", autenticarLider, async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  try {
    if (senha) {
      const senhaCriptografada = bcrypt.hashSync(senha, 10);
      await db.query("UPDATE usuarios SET nome = $1, email = $2, senha = $3, tipo = $4 WHERE id = $5", [nome, email, senhaCriptografada, tipo, req.params.id]);
    } else {
      await db.query("UPDATE usuarios SET nome = $1, email = $2, tipo = $3 WHERE id = $4", [nome, email, tipo, req.params.id]);
    }
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get("/api/usuarios", autenticarLider, async (req, res) => {
  try {
    const result = await db.query("SELECT id, nome, email, tipo FROM usuarios");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
