const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const db = new sqlite3.Database("database.sqlite");

db.serialize(() => {
  // Passo 1: Renomeia a tabela original
  db.run("ALTER TABLE produtos RENAME TO produtos_antigo", (err) => {
    if (err) return console.error("Erro ao renomear tabela:", err.message);

    console.log("Tabela renomeada para produtos_antigo.");

    // Passo 2: Cria nova tabela com preco como REAL
    db.run(
      `CREATE TABLE produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        preco REAL,
        imagem TEXT,
        caracteristica TEXT,
        categoria TEXT
      )`,
      (err) => {
        if (err) return console.error("Erro ao criar nova tabela:", err.message);
        console.log("Nova tabela 'produtos' criada com sucesso.");

        // Passo 3: Copia os dados da tabela antiga para a nova (convertendo o preço)
        db.all("SELECT * FROM produtos_antigo", (err, rows) => {
          if (err) return console.error("Erro ao ler dados antigos:", err.message);

          const insert = db.prepare(
            "INSERT INTO produtos (id, nome, preco, imagem, caracteristica, categoria) VALUES (?, ?, ?, ?, ?, ?)"
          );

          for (const row of rows) {
            // Converte preço string para número (se possível)
            let precoNumerico = parseFloat(
              String(row.preco).replace("R$", "").replace(",", ".").trim()
            );

            // Se não for um número válido, define como 0.00
            if (isNaN(precoNumerico)) precoNumerico = 0.0;

            insert.run(row.id, row.nome, precoNumerico, row.imagem, row.caracteristica, row.categoria);
          }

          insert.finalize(() => {
            console.log("Dados migrados com sucesso para nova tabela.");

            // Passo 4: Remove tabela antiga
            db.run("DROP TABLE produtos_antigo", (err) => {
              if (err) return console.error("Erro ao remover tabela antiga:", err.message);
              console.log("Tabela antiga removida com sucesso.");
              db.close(() => console.log("Conexão com banco fechada."));
            });
          });
        });
      }
    );
  });
});
