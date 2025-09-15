document.addEventListener("DOMContentLoaded", () => {
  // ==== ANIMACIÓN ONLOAD sección "Quién soy" ====
  const aboutSection = document.querySelector(".section--about");
  if (aboutSection) {
    const img = aboutSection.querySelector(".about__image");
    const text = aboutSection.querySelector(".about__text");

    setTimeout(() => {
      img?.classList.add("about__image--animate");
      text?.classList.add("about__text--animate");
    }, 200);
  }

  // ==== MENÚ HAMBURGUESA ====
  const toggle = document.querySelector(".header__toggle");
  const nav = document.querySelector(".header__nav");
  const navLinks = document.querySelectorAll(".header__nav .nav__link");
  const header = document.querySelector(".header");

  if (toggle && nav) {
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("header__nav--active");
      toggle.classList.toggle("header__toggle--active");
      toggle.setAttribute(
        "aria-expanded",
        nav.classList.contains("header__nav--active") ? "true" : "false"
      );
    });

    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("header__nav--active");
        toggle.classList.remove("header__toggle--active");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("header__nav--active")) {
        nav.classList.remove("header__nav--active");
        toggle.classList.remove("header__toggle--active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

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

  // ==== FORMULARIO DE CONTACTO ====
  const form = document.getElementById("contactForm");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const submitBtn = form?.querySelector(".contact__button");

  function validateForm() {
    const emailValid =
      emailInput.value.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());

    const phoneValid =
      phoneInput.value.trim() !== "" &&
      /^[0-9]{10}$/.test(phoneInput.value.trim());

    if (submitBtn) {
      submitBtn.disabled = !(emailValid || phoneValid);
    }
  }

  if (form) {
    emailInput.addEventListener("input", validateForm);

    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, ""); // solo números
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.slice(0, 10); // máximo 10 dígitos
      }
      validateForm();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Formulario enviado correctamente 🚀");
      form.reset();
      validateForm();
    });

    validateForm();
  }

  // ==== EFECTO DEGRADADO EN EL FORMULARIO ====
  const contactCard = document.querySelector(".contact__card");
  const inputs = document.querySelectorAll(".contact__input, .contact__textarea");

  if (contactCard && inputs.length) {
    const colors = ["#00006b", "#0055c5", "#81b8e1", "#ffcb4e", "#8ecc8a", "#ef943e", "#ff7e7f"];
    let colorIndex = 0;
    let intensity = 0;

    function updateBackground() {
      const currentColor = colors[colorIndex];
      const gradient = `linear-gradient(135deg, ${currentColor} ${Math.floor(
        intensity * 100
      )}%, rgba(255,255,255,0.05))`;
      contactCard.style.background = gradient;
      contactCard.style.transition = "background 0.5s ease";
    }

    function nextColor() {
      colorIndex = (colorIndex + 1) % colors.length;
      intensity = 0;
    }

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        intensity += 0.1;
        if (intensity >= 1) {
          nextColor();
        }
        updateBackground();
      });
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
