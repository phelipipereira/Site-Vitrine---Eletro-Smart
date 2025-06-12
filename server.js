const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");

const app = express();
const db = new sqlite3.Database("database.sqlite");

// Pasta para arquivos estáticos (CSS, JS, imagens, páginas públicas)
app.use(express.static("public"));

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets"); // Salva em /public/assets
  },
  filename: function (req, file, cb) {
    const nomeArquivo = Date.now() + "-" + file.originalname;
    cb(null, nomeArquivo);
  }
});
const upload = multer({ storage });

// Para interpretar formulários urlencoded e JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configura sessão
app.use(session({
  secret: "segredo_muito_forte_aqui",
  resave: false,
  saveUninitialized: false
}));

// Rota POST para login de funcionários
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get("SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).send("Erro no servidor.");

    if (user && bcrypt.compareSync(senha, user.senha) && (user.tipo === "funcionario" || user.tipo === "lider")) {
      req.session.userId = user.id;
      req.session.userTipo = user.tipo;
      res.redirect("/painel/Painel.html");
    } else {
      res.send("Login inválido ou sem permissão.");
    }
  });
});

// Middleware para verificar se é funcionário autenticado
function autenticarFuncionario(req, res, next) {
  if (!req.session.userId) return res.redirect("/Login/Login.html");

  db.get("SELECT * FROM usuarios WHERE id = ?", [req.session.userId], (err, user) => {
    if (err || !user || (user.tipo !== "funcionario" && user.tipo !== "lider")) return res.redirect("/Login/Login.html");

    req.user = user;
    next();
  });
}

// Middleware para verificar se é líder
function autenticarLider(req, res, next) {
  if (!req.session.userId) return res.status(401).send("Não autenticado");

  db.get("SELECT * FROM usuarios WHERE id = ?", [req.session.userId], (err, user) => {
    if (err || !user || user.tipo !== "lider") return res.status(403).send("Acesso negado");

    req.user = user;
    next();
  });
}

// Painel protegido
app.get("/painel", autenticarFuncionario, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Painel", "painel.html"));
});

// API pública para listar produtos
app.get("/api/produtos", (req, res) => {
  db.all("SELECT * FROM produtos", (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// *** NOVA ROTA ADICIONADA ***
// API para obter um produto pelo ID (necessária para edição)
app.get("/api/produtos/:id", autenticarFuncionario, (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM produtos WHERE id = ?", [id], (err, produto) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(produto);
  });
});

// API protegida para adicionar produto (com imagem)
app.post("/api/produtos", autenticarFuncionario, upload.single("imagem"), (req, res) => {
  const { nome, preco, categoria, caracteristica } = req.body;
  const imagem = req.file ? "/assets/" + req.file.filename : "";
  const precoConvertido = parseFloat(preco);

  db.run(
    "INSERT INTO produtos (nome, preco, imagem, categoria, caracteristica) VALUES (?, ?, ?, ?, ?)",
    [nome, precoConvertido, imagem, categoria, caracteristica],
    (err) => {
      if (err) return res.status(500).json({ sucesso: false, erro: err.message });
      res.json({ sucesso: true });
    }
  );
});

// API protegida para editar produto
app.put("/api/produtos/:id", autenticarFuncionario, upload.single("imagem"), (req, res) => {
  const { nome, preco, categoria, caracteristica } = req.body;
  const id = req.params.id;
  const precoConvertido = parseFloat(preco);
  const imagem = req.file ? "/assets/" + req.file.filename : null;

  const query = imagem
    ? "UPDATE produtos SET nome = ?, preco = ?, imagem = ?, categoria = ?, caracteristica = ? WHERE id = ?"
    : "UPDATE produtos SET nome = ?, preco = ?, categoria = ?, caracteristica = ? WHERE id = ?";

  const params = imagem
    ? [nome, precoConvertido, imagem, categoria, caracteristica, id]
    : [nome, precoConvertido, categoria, caracteristica, id];

  db.run(query, params, (err) => {
    if (err) return res.status(500).json({ sucesso: false, erro: err.message });
    res.json({ sucesso: true });
  });
});

// API protegida para deletar produto
app.delete("/api/produtos/:id", autenticarFuncionario, (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM produtos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ sucesso: false, erro: err.message });
    res.json({ sucesso: true });
  });
});

// API protegida para adicionar usuários (somente líder)
app.post("/api/usuarios", autenticarLider, (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const senhaCriptografada = bcrypt.hashSync(senha, 10);

  db.run(
    "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)",
    [nome, email, senhaCriptografada, tipo || "funcionario"],
    (err) => {
      if (err) return res.status(500).json({ sucesso: false, erro: err.message });
      res.json({ sucesso: true });
    }
  );
});

// API para obter dados do usuário logado
app.get("/api/usuario-logado", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  db.get("SELECT id, nome, email, tipo FROM usuarios WHERE id = ?", [req.session.userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ erro: "Erro ao buscar usuário logado" });
    }

    res.json(user);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
