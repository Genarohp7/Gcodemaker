document.addEventListener("DOMContentLoaded", () => {
  // ==== SECCIONES pantalla completa ====
  const sections = Array.from(document.querySelectorAll(".section"));
  const dotsContainer = document.getElementById("navDots");

  if (!sections.length || !dotsContainer) return;

  let current = 0;
  let isThrottled = false;

  function showSection(index) {
    sections.forEach((sec, i) => {
      sec.classList.remove("active", "inactive");
      sec.classList.add(i === index ? "active" : "inactive");
    });
    updateDots(index);
  }

  // Crea puntos según número de secciones
  function buildDots() {
    dotsContainer.innerHTML = "";
    sections.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dots__item";
      dot.type = "button";
      dot.setAttribute("aria-label", `Ir a la sección ${i + 1}`);
      dot.addEventListener("click", () => {
        if (isThrottled || current === i) return;
        current = i;
        showSection(current);
        throttle();
      });
      dotsContainer.appendChild(dot);
    });
    updateDots(current);
  }

  function updateDots(activeIndex) {
    const dots = dotsContainer.querySelectorAll(".dots__item");
    dots.forEach((d, i) => {
      d.classList.toggle("dots__item--active", i === activeIndex);
      d.setAttribute("aria-current", i === activeIndex ? "true" : "false");
    });
  }

  function throttle() {
    isThrottled = true;
    setTimeout(() => (isThrottled = false), 650);
  }

  // Mostrar la primera sección y construir los puntos
  showSection(current);
  buildDots();

  // ==== Desktop: rueda del ratón ====
  window.addEventListener(
    "wheel",
    (e) => {
      if (isThrottled) return;
      if (e.deltaY > 0 && current < sections.length - 1) {
        current++;
        showSection(current);
        throttle();
      } else if (e.deltaY < 0 && current > 0) {
        current--;
        showSection(current);
        throttle();
      }
      e.preventDefault?.();
    },
    { passive: false }
  );

  // ==== Teclado (← →) ====
  window.addEventListener("keydown", (e) => {
    if (isThrottled) return;
    if (e.key === "ArrowRight" && current < sections.length - 1) {
      current++;
      showSection(current);
      throttle();
    } else if (e.key === "ArrowLeft" && current > 0) {
      current--;
      showSection(current);
      throttle();
    }
  });

  // ==== Móvil/Tablet: swipe horizontal ====
  let touchStartX = 0;
  let touchEndX = 0;

  window.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    (e) => {
      if (isThrottled) return;
      touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;

      const TH = 50; // umbral mínimo en px
      if (deltaX > TH && current < sections.length - 1) {
        // swipe izquierda → siguiente sección
        current++;
        showSection(current);
        throttle();
      } else if (deltaX < -TH && current > 0) {
        // swipe derecha → sección anterior
        current--;
        showSection(current);
        throttle();
      }
    },
    { passive: true }
  );
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
