document.addEventListener("DOMContentLoaded", () => {
  // ==== ANIMACIÓN ONLOAD sección "Quién soy" ====
  const aboutSection = document.querySelector(".section--about");
  if (aboutSection) {
    const img = aboutSection.querySelector(".about__image");
    const text = aboutSection.querySelector(".about__text");

    // Disparamos la animación solo una vez al cargar
    setTimeout(() => {
      img?.classList.add("about__image--animate");
      text?.classList.add("about__text--animate");
    }, 200); // pequeño delay para que se note
  }

  // ==== MENÚ HAMBURGUESA ====
  const toggle = document.querySelector(".header__toggle");
  const nav = document.querySelector(".header__nav");
  const navLinks = document.querySelectorAll(".header__nav .nav__link");
  const header = document.querySelector(".header");

  if (toggle && nav) {
    toggle.setAttribute("aria-expanded", "false");

    // Abrir/cerrar
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("header__nav--active");
      toggle.classList.toggle("header__toggle--active");
      toggle.setAttribute(
        "aria-expanded",
        nav.classList.contains("header__nav--active") ? "true" : "false"
      );
    });

    // Cerrar al hacer clic en un enlace
    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("header__nav--active");
        toggle.classList.remove("header__toggle--active");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("header__nav--active")) {
        nav.classList.remove("header__nav--active");
        toggle.classList.remove("header__toggle--active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Cerrar al hacer clic fuera del header
    document.addEventListener("click", (e) => {
      if (
        nav.classList.contains("header__nav--active") &&
        header &&
        !header.contains(e.target)
      ) {
        nav.classList.remove("header__nav--active");
        toggle.classList.remove("header__toggle--active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ==== SECCIONES pantalla completa + PUNTOS ====
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

  // Primera sección y puntos
  showSection(current);
  buildDots();

  // ==== Desktop: rueda del ratón ====
  window.addEventListener(
    "wheel",
    (e) => {
      if (isThrottled) return;
      if (nav && nav.classList.contains("header__nav--active")) return;

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
    if (nav && nav.classList.contains("header__nav--active")) return;

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
      if (nav && nav.classList.contains("header__nav--active")) return;

      touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;

      const TH = 50;
      if (deltaX > TH && current < sections.length - 1) {
        current++;
        showSection(current);
        throttle();
      } else if (deltaX < -TH && current > 0) {
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

  if (!pages.length) return;

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
    pagerEl.textContent = `${Math.min(current + 1, pages.length)} / ${pages.length}`;
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
