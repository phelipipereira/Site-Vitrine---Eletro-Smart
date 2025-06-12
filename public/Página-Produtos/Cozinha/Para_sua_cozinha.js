const selecaoOrdenar = document.getElementById("ordenar");
const container = document.getElementById("todos-pdt");

let todosProdutos = [];

// Função para criar o HTML de um produto e retornar elemento DOM
function criarBoxProduto(produto) {
  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // Cria o elemento div
  const div = document.createElement("div");
  div.className = "box-produto";

  // Atribui os data-attributes para facilitar a ordenação depois
  div.dataset.preco = produto.preco;
  div.dataset.nome = produto.nome.toLowerCase();

  div.innerHTML = `
    <img src="${produto.imagem}" alt="${produto.nome}" />
    <p class="nome">${produto.nome}</p>
    <p class="preco">${precoFormatado}</p>
  `;

  return div;
}

// Função para montar o container com os produtos
function mostrarProdutos(listaProdutos) {
  container.innerHTML = "";
  listaProdutos.forEach(produto => {
    const box = criarBoxProduto(produto);
    container.appendChild(box);
  });
}

// Manipulador do select para ordenar e mostrar os produtos
selecaoOrdenar.addEventListener("change", () => {
  let ordenado;

  switch (selecaoOrdenar.value) {
    case "Maior-preço":
      ordenado = [...produtos].sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco));
      break;
    case "Menor-preço":
      ordenado = [...produtos].sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco));
      break;
    case "a-z":
      ordenado = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case "z-a":
      ordenado = [...produtos].sort((a, b) => b.nome.localeCompare(a.nome));
      break;
    default:
      ordenado = produtos;
  }

  mostrarProdutos(ordenado);
});

// Carrega os produtos da API e já mostra na tela
async function carregarProdutos() {
  try {
    const response = await fetch("/api/produtos");
    todosProdutos = await response.json();

    produtos = todosProdutos.filter(produto => produto.categoria === "cozinha");

    mostrarProdutos(produtos);
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

carregarProdutos();
