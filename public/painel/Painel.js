document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("userInfo");
  const logoutBtn = document.getElementById("logoutBtn");

  const produtosList = document.getElementById("produtosList");
  const formProduto = document.getElementById("formProduto");
  const msgProduto = document.getElementById("msgProduto");

  const adicionarFuncionarioSection = document.getElementById("adicionarFuncionarioSection");
  const formFuncionario = document.getElementById("formFuncionario");
  const msgFuncionario = document.getElementById("msgFuncionario");

  fetch("/api/usuario-logado")
    .then(res => res.json())
    .then(user => {
      userInfo.textContent = `Usuário: ${user.nome} (${user.tipo})`;
      if (user.tipo === "lider") {
        adicionarFuncionarioSection.style.display = "block";
      }
    })
    .catch(() => {
      userInfo.textContent = "Erro ao carregar usuário.";
    });

  logoutBtn.addEventListener("click", () => {
    fetch("/logout", { method: "POST" }).then(() => {
      window.location.href = "/Login/Login.html";
    });
  });

  function listarProdutos() {
    produtosList.innerHTML = "<li>Carregando...</li>";
    fetch("/api/produtos")
      .then(res => res.json())
      .then(produtos => {
        produtosList.innerHTML = "";
        produtos.forEach(prod => {
          const li = document.createElement("li");

          li.innerHTML = `
            <div class="produto-info">
              <strong>${prod.nome}</strong> -> R$ ${prod.preco} -> ${prod.categoria}
            </div>
            <div class="produto-acoes">
              <button class="btn-editar" data-id="${prod.id}">Editar</button>
              <button class="btn-excluir" data-id="${prod.id}">Excluir</button>
            </div>
          `;

          produtosList.appendChild(li);
        });
      })
      .catch(() => {
        produtosList.innerHTML = "<li>Erro ao carregar produtos.</li>";
      });
  }

  listarProdutos();

  formProduto.addEventListener("submit", e => {
    e.preventDefault();
    msgProduto.textContent = "";

    const formData = new FormData(formProduto);

    fetch("/api/produtos", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(res => {
        if (res.sucesso) {
          msgProduto.style.color = "green";
          msgProduto.textContent = "Produto adicionado com sucesso!";
          formProduto.reset();
          listarProdutos();
        } else {
          msgProduto.style.color = "red";
          msgProduto.textContent = "Erro ao adicionar produto.";
        }
      })
      .catch(() => {
        msgProduto.style.color = "red";
        msgProduto.textContent = "Erro ao adicionar produto.";
      });
  });

  formFuncionario.addEventListener("submit", e => {
    e.preventDefault();
    msgFuncionario.textContent = "";

    const formData = new FormData(formFuncionario);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        if (res.sucesso) {
          msgFuncionario.style.color = "green";
          msgFuncionario.textContent = "Funcionário adicionado com sucesso!";
          formFuncionario.reset();
        } else {
          msgFuncionario.style.color = "red";
          msgFuncionario.textContent = "Erro ao adicionar funcionário.";
        }
      })
      .catch(() => {
        msgFuncionario.style.color = "red";
        msgFuncionario.textContent = "Erro ao adicionar funcionário.";
      });
  });

  // Escutar cliques nos botões de editar/excluir usando delegação
  produtosList.addEventListener("click", (e) => {
    const btn = e.target;
    const id = btn.dataset.id;

    if (btn.classList.contains("btn-excluir")) {
      if (confirm("Tem certeza que deseja excluir este produto?")) {
        fetch(`/api/produtos/${id}`, {
          method: "DELETE"
        })
          .then(res => res.json())
          .then(res => {
            if (res.sucesso) {
              listarProdutos();
            } else {
              alert("Erro ao excluir produto.");
            }
          });
      }
    }

    if (btn.classList.contains("btn-editar")) {
      // Buscar dados do produto
      fetch(`/api/produtos/${id}`)
        .then(res => res.json())
        .then(prod => {
          // Preenche os campos do formulário com os dados do produto
          formProduto.nome.value = prod.nome;
          formProduto.preco.value = prod.preco;
          formProduto.categoria.value = prod.categoria;
          formProduto.caracteristica.value = prod.caracteristica;
          formProduto.scrollIntoView({ behavior: "smooth" });

          // Troca o submit para atualizar
          const atualizarBtn = document.createElement("button");
          atualizarBtn.textContent = "Atualizar";
          atualizarBtn.type = "button";
          atualizarBtn.style.backgroundColor = "#28a745";
          formProduto.appendChild(atualizarBtn);

          atualizarBtn.addEventListener("click", () => {
            const updateFormData = new FormData(formProduto);

            fetch(`/api/produtos/${id}`, {
              method: "PUT",
              body: updateFormData
            })
              .then(res => res.json())
              .then(res => {
                if (res.sucesso) {
                  msgProduto.style.color = "green";
                  msgProduto.textContent = "Produto atualizado com sucesso!";
                  formProduto.reset();
                  atualizarBtn.remove();
                  listarProdutos();
                } else {
                  msgProduto.style.color = "red";
                  msgProduto.textContent = "Erro ao atualizar produto.";
                }
              });
          });
        });
    }
  });
});
