// Seleciona os elementos do DOM
const carrosselSlides = document.querySelector(".carrossel-slides");
const setaEsquerda = document.querySelector(".seta-esquerda");
const setaDireita = document.querySelector(".seta-direita");

let produtos = [];
let slideAtual = 0;
const produtosPorSlide = 2;

// Função para criar o HTML de um produto
function criarBoxProduto(produto) {
  
  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return `
    <div class="box-produto">
      <img src="${produto.imagem}" alt="${produto.nome}" />
      <p class="nome">${produto.nome}</p>
       <p class="preco"> ${precoFormatado}</p>
    </div>
  `;
}

// Monta os slides, 2 produtos por slide
function montarSlides() {
  carrosselSlides.innerHTML = "";

  for (let i = 0; i < produtos.length; i += produtosPorSlide) {
    const sliceProdutos = produtos.slice(i, i + produtosPorSlide);
    const slideHTML = sliceProdutos.map(criarBoxProduto).join("");
    const slide = document.createElement("div");
    slide.classList.add("slide");
    slide.innerHTML = slideHTML;
    carrosselSlides.appendChild(slide);
  }

  atualizarPosicao();
}

// Atualiza a posição do carrossel para mostrar o slide atual
function atualizarPosicao() {
  if (carrosselSlides.querySelector(".slide")) {
    const larguraSlide = carrosselSlides.querySelector(".slide").offsetWidth;
    carrosselSlides.style.transform = `translateX(-${slideAtual * larguraSlide}px)`;
  }
}

// Navegação para o slide anterior
function slideAnterior() {
  if (slideAtual > 0) {
    slideAtual--;
    atualizarPosicao();
  }
}

// Navegação para o próximo slide
function slideProximo() {
  const maxSlide = carrosselSlides.children.length - 1;
  if (slideAtual < maxSlide) {
    slideAtual++;
    atualizarPosicao();
  }
}

// Carrega os produtos da API
async function carregarProdutos() {
  try {
    const response = await fetch("/api/produtos");
    let todosProdutos = await response.json();

    // Filtra só os produtos 'mais vendido'
    produtos = todosProdutos.filter(produto => produto.caracteristica === "mais vendido");

    montarSlides();
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

// Event listeners das setas
setaEsquerda.addEventListener("click", slideAnterior);
setaDireita.addEventListener("click", slideProximo);

// Inicia
carregarProdutos();
