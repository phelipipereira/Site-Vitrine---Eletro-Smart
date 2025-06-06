const selecaoOrdenar = document.getElementById("ordenar");
const container = document.getElementById("Todos-os-Produtos");

selecaoOrdenar.addEventListener("change", () => {
    const produtos= Array.from(container.querySelectorAll(".box-produto"));
    const criterio = selecaoOrdenar.value;

    switch(criterio){
        case "Maior-preço":
      ordenado = produtos.sort((a, b) => parseFloat(a.dataset.preco) - parseFloat(b.dataset.preco));
      break;
    case "Menor-preço":
      ordenado = produtos.sort((a, b) => parseFloat(b.dataset.preco) - parseFloat(a.dataset.preco));
      break;
    case "a-z":
      ordenado = produtos.sort((a, b) => a.dataset.nome.localeCompare(b.dataset.nome));
      break;
    case "z-a":
      ordenado = produtos.sort((a, b) => b.dataset.nome.localeCompare(a.dataset.nome));
      break;
    default:
      ordenado = produtos;
  }

  container.innerHTML = "";
  ordenado.forEach(produto => container.appendChild(produto));
});