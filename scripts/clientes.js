// ============================
// CLIENTES - CARRUSEL
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".clients__track");
  const cards = document.querySelectorAll(".clients__card");
  const btnPrev = document.querySelector(".clients__btn--prev");
  const btnNext = document.querySelector(".clients__btn--next");
  const pager = document.getElementById("clientsPager");

  if (!track || !cards.length || !btnPrev || !btnNext || !pager) return;

  let currentIndex = 0;
  const total = cards.length;

  // 🎨 Paleta de colores (usa las variables CSS definidas en :root)
  const colors = [
    "var(--color1)",
    "var(--color2)",
    "var(--color3)",
    "var(--color4)",
    "var(--color5)",
  ];

  // Asignar colores a cada tarjeta
  function assignColors() {
    cards.forEach((card, index) => {
      const color = colors[index % colors.length]; // reinicia al acabar
      card.style.backgroundColor = color;

      // Si necesitas que el texto se vea bien, puedes ajustar aquí:
      if (color === "var(--color2)" || color === "var(--color1)") {
        card.style.color = "#000"; // texto oscuro en colores claros
      } else {
        card.style.color = "#fff"; // texto claro en colores oscuros
      }
    });
  }

  function updateCarousel() {
    const offset = -currentIndex * 100; // 100% por slide
    track.style.transform = `translateX(${offset}%)`;

    pager.textContent = `${currentIndex + 1} / ${total}`;

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === total - 1;
  }

  btnPrev.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  btnNext.addEventListener("click", () => {
    if (currentIndex < total - 1) {
      currentIndex++;
      updateCarousel();
    }
  });

  // Navegación con teclado
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    } else if (e.key === "ArrowRight" && currentIndex < total - 1) {
      currentIndex++;
      updateCarousel();
    }
  });

  // Inicial
  assignColors();
  updateCarousel();
});
