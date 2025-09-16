document.addEventListener("DOMContentLoaded", () => {
  const image = document.querySelector(".quien-soy__image");
  const textBlocks = document.querySelectorAll(".quien-soy__text p");

  // Animación de fade-in suave al cargar
  image.style.opacity = "0";
  image.style.transform = "translateY(20px)";
  textBlocks.forEach((p) => {
    p.style.opacity = "0";
    p.style.transform = "translateY(20px)";
  });

  setTimeout(() => {
    image.style.transition = "all 0.8s ease";
    image.style.opacity = "1";
    image.style.transform = "translateY(0)";

    textBlocks.forEach((p, i) => {
      setTimeout(() => {
        p.style.transition = "all 0.8s ease";
        p.style.opacity = "1";
        p.style.transform = "translateY(0)";
      }, i * 150); // retraso escalonado
    });
  }, 200);
});
