const carrossel = document.querySelector(".carrossel-slides");
const slides = document.querySelectorAll(".slide");
const setaEsquerda = document.querySelector(".seta-esquerda");
const setaDireita = document.querySelector(".seta-direita");

let index = 0;

function atualizarCarrossel() {
  const slideWidth = slides[0].offsetWidth;
  carrossel.style.transform = `translateX(-${index * slideWidth}px)`;
}

setaDireita.addEventListener("click", () => {
  if (index < slides.length - 1) {
    index++;
  } else {
    index = 0; 
  }
  atualizarCarrossel();
});

setaEsquerda.addEventListener("click", () => {
  if (index > 0) {
    index--;
  } else {
    index = slides.length - 1;
  }
  atualizarCarrossel();
});
window.addEventListener("resize", atualizarCarrossel);
