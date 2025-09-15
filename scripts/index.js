document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".section");
  let current = 0;
  let isThrottled = false;

  function showSection(index) {
    sections.forEach((sec, i) => {
      sec.classList.remove("active", "inactive");
      if (i === index) {
        sec.classList.add("active");
      } else {
        sec.classList.add("inactive");
      }
    });
  }

  // Mostrar la primera sección
  showSection(current);

  // ==== Control con rueda del ratón ====
  window.addEventListener("wheel", (e) => {
    if (isThrottled) return;
    isThrottled = true;

    if (e.deltaY > 0 && current < sections.length - 1) {
      current++;
    } else if (e.deltaY < 0 && current > 0) {
      current--;
    }
    showSection(current);

    setTimeout(() => {
      isThrottled = false;
    }, 1000);
  });

  // ==== Control con gestos táctiles ====
  let touchStartY = 0;
  let touchEndY = 0;

  window.addEventListener("touchstart", (e) => {
    touchStartY = e.changedTouches[0].clientY;
  });

  window.addEventListener("touchend", (e) => {
    if (isThrottled) return;
    isThrottled = true;

    touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    if (deltaY > 50 && current < sections.length - 1) {
      current++; // deslizó hacia arriba
    } else if (deltaY < -50 && current > 0) {
      current--; // deslizó hacia abajo
    }
    showSection(current);

    setTimeout(() => {
      isThrottled = false;
    }, 1000);
  });
});

// ==== Clientes "Book Effect" ====
document.addEventListener("DOMContentLoaded", () => {
  const pages = Array.from(document.querySelectorAll(".clients__page"));
  const btnPrev = document.querySelector(".clients__btn--prev");
  const btnNext = document.querySelector(".clients__btn--next");
  const pagerEl = document.getElementById("clientsPager");

  if (!pages.length) return; // seguridad si no existe sección

  let current = 0;

  function layoutStack() {
    pages.forEach((page, i) => {
      page.style.zIndex = (pages.length - i).toString();
    });
  }

  function render() {
    pages.forEach((page, i) => {
      page.classList.toggle("flipped", i < current);
    });
    pagerEl.textContent = `${Math.min(current + 1, pages.length)} / ${
      pages.length
    }`;
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === pages.length - 1;
  }

  btnNext.addEventListener("click", () => {
    if (current < pages.length - 1) {
      current++;
      render();
    }
  });

  btnPrev.addEventListener("click", () => {
    if (current > 0) {
      current--;
      render();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") btnNext.click();
    if (e.key === "ArrowLeft") btnPrev.click();
  });

  layoutStack();
  render();
});
