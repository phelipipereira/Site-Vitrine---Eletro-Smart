document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("userInfo");
  const logoutBtn = document.getElementById("logoutBtn");

  const produtosList = document.getElementById("produtosList");
  const formProduto = document.getElementById("formProduto");
  const msgProduto = document.getElementById("msgProduto");

  const adicionarFuncionarioSection = document.getElementById("adicionarFuncionarioSection");
  const formFuncionario = document.getElementById("formFuncionario");
  const msgFuncionario = document.getElementById("msgFuncionario");
  const usuariosList = document.getElementById("usuariosList");

  fetch("/api/usuario-logado")
    .then(res => res.json())
    .then(user => {
      userInfo.textContent = `Usuário: ${user.nome} (${user.tipo})`;
      if (user.tipo === "lider") {
        adicionarFuncionarioSection.style.display = "block";
        listarUsuarios(); // Listar usuários só se for líder
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
          listarUsuarios();
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

  function listarUsuarios() {
    const usuariosList = document.getElementById("usuariosList");
    usuariosList.innerHTML = "<li>Carregando...</li>";

    fetch("/api/usuarios")
      .then(res => res.json())
      .then(usuarios => {
        usuariosList.innerHTML = "";
        usuarios.forEach(user => {
          const li = document.createElement("li");

          li.innerHTML = `
            <div class="usuario-info">
              <strong>${user.nome}</strong> -> ${user.email} -> ${user.tipo}
            </div>
            <div class="usuario-acoes">
              <button class="btn-editar-usuario" data-id="${user.id}">Editar</button>
              <button class="btn-excluir-usuario" data-id="${user.id}">Excluir</button>
            </div>
          `;

          usuariosList.appendChild(li);
        });
      })
      .catch(() => {
        usuariosList.innerHTML = "<li>Erro ao carregar usuários.</li>";
      });
  }
  
  fetch('/api/usuario-logado')
    .then(res => res.json())
    .then(user => {
      if (user.tipo === "lider") {
        document.getElementById("usuarioSection").style.display = "block";
      } else {
        document.getElementById("usuarioSection").style.display = "none";
      }
    })
    .catch(() => {
      // Se erro, pode esconder a seção por segurança
      document.getElementById("usuarioSection").style.display = "none";
    });

  

  usuariosList.addEventListener("click", (e) => {
    const btn = e.target;
    const id = btn.dataset.id;

    if (btn.classList.contains("btn-excluir-usuario")) {
      if (confirm("Tem certeza que deseja excluir este usuário?")) {
        fetch(`/api/usuarios/${id}`, {
          method: "DELETE"
        })
        .then(res => res.json())
        .then(res => {
          if (res.sucesso) {
            listarUsuarios(); // Atualiza a lista após exclusão
          } else {
            alert("Erro ao excluir usuário.");
          }
        })
        .catch(() => alert("Erro na requisição."));
      }
    }

    if (btn.classList.contains("btn-editar-usuario")) {
      // Buscar dados do usuário para edição
      fetch(`/api/usuarios`)
        .then(res => res.json())
        .then(users => {
          const user = users.find(u => u.id == id);
          if (!user) {
            alert("Usuário não encontrado");
            return;
          }
          
          formFuncionario.nome.value = user.nome;
          formFuncionario.email.value = user.email;
          formFuncionario.tipo.value = user.tipo;
          formFuncionario.senha.value = ""; 

          formFuncionario.scrollIntoView({ behavior: "smooth" });

          
          const btnAtualizarExistente = formFuncionario.querySelector(".btn-atualizar-usuario");
          if (btnAtualizarExistente) btnAtualizarExistente.remove();

          
          const atualizarBtn = document.createElement("button");
          atualizarBtn.textContent = "Atualizar Usuário";
          atualizarBtn.type = "button";
          atualizarBtn.classList.add("btn-atualizar-usuario");
          atualizarBtn.style.backgroundColor = "#28a745";
          formFuncionario.appendChild(atualizarBtn);

          atualizarBtn.addEventListener("click", () => {
            msgFuncionario.textContent = "";

            
            const dataAtualizada = {
              nome: formFuncionario.nome.value,
              email: formFuncionario.email.value,
              tipo: formFuncionario.tipo.value
            };

          
            if (formFuncionario.senha.value.trim() !== "") {
              dataAtualizada.senha = formFuncionario.senha.value;
            }

            fetch(`/api/usuarios/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataAtualizada)
            })
              .then(res => res.json())
              .then(res => {
                if (res.sucesso) {
                  msgFuncionario.style.color = "green";
                  msgFuncionario.textContent = "Usuário atualizado com sucesso!";
                  formFuncionario.reset();
                  atualizarBtn.remove();
                  listarUsuarios();
                } else {
                  msgFuncionario.style.color = "red";
                  msgFuncionario.textContent = "Erro ao atualizar usuário.";
                }
              })
              .catch(() => {
                msgFuncionario.style.color = "red";
                msgFuncionario.textContent = "Erro na requisição.";
              });
          });
        });
    }
  });

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

          formProduto.scrollIntoView({ behavior: "smooth" });

          // Remove botão atualizar antigo se houver
          const btnAtualizarExistente = formProduto.querySelector(".btn-atualizar-produto");
          if (btnAtualizarExistente) btnAtualizarExistente.remove();

          // Cria botão atualizar
          const atualizarBtn = document.createElement("button");
          atualizarBtn.textContent = "Atualizar Produto";
          atualizarBtn.type = "button";
          atualizarBtn.classList.add("btn-atualizar-produto");
          atualizarBtn.style.backgroundColor = "#28a745";
          formProduto.appendChild(atualizarBtn);

          atualizarBtn.addEventListener("click", () => {
            msgProduto.textContent = "";

            const dataAtualizada = {
              nome: formProduto.nome.value,
              preco: parseFloat(formProduto.preco.value),
              categoria: formProduto.categoria.value
            };

            fetch(`/api/produtos/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataAtualizada)
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
              })
              .catch(() => {
                msgProduto.style.color = "red";
                msgProduto.textContent = "Erro na requisição.";
              });
          });
        });
    }
  });
});
