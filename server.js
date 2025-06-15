
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");
const multer = require("multer");
const { storage } = require("./cloudinaryConfig"); 

const upload = multer({ storage }); 
const app = express();

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    store: new pgSession({
      pool: db,
      tableName: "session",
    }),
    secret: "segredo_muito_forte_aqui",
    resave: false,
    saveUninitialized: false,
  })
);

// Rotas públicas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "homepage", "HomePage.html"));
});

// Login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await db.query(
      "SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (user && bcrypt.compareSync(senha, user.senha) && ["funcionario", "lider"].includes(user.tipo)) {
      req.session.userId = user.id;
      req.session.userTipo = user.tipo;
      return res.redirect("/painel/Painel.html");
    } else {
      return res.status(401).send("Login inválido ou sem permissão.");
    }
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).send("Erro no servidor.");
  }
});

// Middleware para autenticação de funcionário
async function autenticarFuncionario(req, res, next) {
  if (!req.session.userId) return res.redirect("/Login/Login.html");
  try {
    const result = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.session.userId]);
    const user = result.rows[0];
    if (!user || !["funcionario", "lider"].includes(user.tipo)) return res.redirect("/Login/Login.html");
    req.user = user;
    next();
  } catch (err) {
    console.error("Erro na autenticação:", err);
    return res.redirect("/Login/Login.html");
  }
}

// Middleware para autenticação de líder
async function autenticarLider(req, res, next) {
  if (!req.session.userId) return res.status(401).send("Não autenticado");
  try {
    const result = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.session.userId]);
    const user = result.rows[0];
    if (!user || user.tipo !== "lider") return res.status(403).send("Acesso negado");
    req.user = user;
    next();
  } catch (err) {
    console.error("Erro na autenticação líder:", err);
    return res.status(403).send("Acesso negado");
  }
}

// Rota painel (proteção)
app.get("/painel", autenticarFuncionario, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Painel", "painel.html"));
});

// API Produtos - Listar todos
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM produtos");
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: err.message });
  }
});

// API Produtos - Obter 1 produto por ID
app.get("/api/produtos/:id", autenticarFuncionario, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM produtos WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: err.message });
  }
});

// API Produtos - Criar novo produto com upload imagem
app.post("/api/produtos", autenticarFuncionario, upload.single("imagem"), async (req, res) => {

  const { nome, preco, categoria, caracteristica } = req.body;
  const imagem = req.file ? req.file.path : null; // URL Cloudinary
  const precoConvertido = parseFloat(preco);

  try {
    await db.query(
      "INSERT INTO produtos (nome, preco, imagem, categoria, caracteristica) VALUES ($1, $2, $3, $4, $5)",
      [nome, precoConvertido, imagem, categoria, caracteristica]
    );
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Produtos - Atualizar produto (opcional imagem)
app.put("/api/produtos/:id", autenticarFuncionario, upload.single("imagem"), async (req, res) => {
  const { nome, preco, categoria, caracteristica } = req.body;
  const imagem = req.file ? req.file.path : null;
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
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Produtos - Deletar
app.delete("/api/produtos/:id", autenticarFuncionario, async (req, res) => {
  try {
    await db.query("DELETE FROM produtos WHERE id = $1", [req.params.id]);
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao deletar produto:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Usuários - Criar (apenas líder)
app.post("/api/usuarios", autenticarLider, async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const senhaCriptografada = bcrypt.hashSync(senha, 10);

  try {
    await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4)",
      [nome, email, senhaCriptografada, tipo]
    );
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Usuários - Deletar (apenas líder)
app.delete("/api/usuarios/:id", autenticarLider, async (req, res) => {
  try {
    const result = await db.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ sucesso: false, erro: "Usuário não encontrado" });
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Usuário logado - detalhes
app.get("/api/usuario-logado", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: "Não autenticado" });

  try {
    const result = await db.query("SELECT id, nome, email, tipo FROM usuarios WHERE id = $1", [req.session.userId]);
    if (result.rows.length === 0) return res.status(500).json({ erro: "Erro ao buscar usuário logado" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar usuário logado:", err);
    return res.status(500).json({ erro: err.message });
  }
});

// API Usuários - Atualizar (apenas líder)
app.put("/api/usuarios/:id", autenticarLider, async (req, res) => {
  const { nome, email, senha, tipo } = req.body;

  try {
    if (senha) {
      const senhaCriptografada = bcrypt.hashSync(senha, 10);
      await db.query(
        "UPDATE usuarios SET nome = $1, email = $2, senha = $3, tipo = $4 WHERE id = $5",
        [nome, email, senhaCriptografada, tipo, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE usuarios SET nome = $1, email = $2, tipo = $3 WHERE id = $4",
        [nome, email, tipo, req.params.id]
      );
    }
    return res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// API Usuários - Listar (apenas líder)
app.get("/api/usuarios", autenticarLider, async (req, res) => {
  try {
    const result = await db.query("SELECT id, nome, email, tipo FROM usuarios");
    return res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    return res.status(500).json({ erro: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
