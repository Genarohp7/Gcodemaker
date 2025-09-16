document.addEventListener("DOMContentLoaded", () => {
  /* =============================
     ANIMACIÓN ONLOAD (Sección About)
  ============================== */
  const aboutSection = document.querySelector(".section--about");
  if (aboutSection) {
    const img = aboutSection.querySelector(".about__image");
    const text = aboutSection.querySelector(".about__text");
    setTimeout(() => {
      img?.classList.add("about__image--animate");
      text?.classList.add("about__text--animate");
    }, 200);
  }

  /* =============================
     FORMULARIO DE CONTACTO
  ============================== */
  const form = document.getElementById("contactForm");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const submitBtn = form?.querySelector(".contact__button");

  function validateForm() {
    const emailValid =
      !!emailInput?.value.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());

    const phoneValid =
      !!phoneInput?.value.trim() &&
      /^[0-9]{10}$/.test(phoneInput.value.trim());

    if (submitBtn) submitBtn.disabled = !(emailValid || phoneValid);
  }

  if (form) {
    emailInput?.addEventListener("input", validateForm);

    // Tel: solo números y tope 10 dígitos
    phoneInput?.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.slice(0, 10);
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

  /* =============================
     EFECTO DEGRADADO REACTIVO EN CONTACTO
  ============================== */
  const contactCard = document.querySelector(".contact__card");
  const inputs = document.querySelectorAll(".contact__input, .contact__textarea");

  if (contactCard && inputs.length) {
    const colors = ["#00006b", "#0055c5", "#81b8e1", "#ffcb4e", "#8ecc8a", "#ef943e", "#ff7e7f"];
    let colorIndex = 0;
    let intensity = 0;

    function updateBackground() {
      const currentColor = colors[colorIndex];
      const pct = Math.min(100, Math.floor(intensity * 100));
      contactCard.style.background = `linear-gradient(135deg, ${currentColor} ${pct}%, rgba(255,255,255,0.05))`;
      contactCard.style.transition = "background 0.5s ease";
    }

    function nextColor() {
      colorIndex = (colorIndex + 1) % colors.length;
      intensity = 0;
    }

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        intensity += 0.1;
        if (intensity >= 1) nextColor();
        updateBackground();
      });
    });
  }

  /* =============================
     SLIDE ENTRE SECCIONES (INDEX)
     Requiere .section en cada bloque
  ============================== */
  const isIndex =
    document.body.classList.contains("page--index") ||
    location.pathname.endsWith("/index.html") ||
    location.pathname === "/";

  if (isIndex) {
    const sections = Array.from(document.querySelectorAll(".section"));
    const dotsContainer = document.getElementById("navDots");
    const nav = document.querySelector(".header__nav");

    if (sections.length) {
      let current = 0;
      let isThrottled = false;

      function updateDots(activeIndex) {
        if (!dotsContainer) return; // no-op si no hay dots
        const dots = dotsContainer.querySelectorAll(".dots__item");
        dots.forEach((d, i) => {
          d.classList.toggle("dots__item--active", i === activeIndex);
          d.setAttribute("aria-current", i === activeIndex ? "true" : "false");
        });
      }

      function showSection(index, { updateHash = true } = {}) {
        sections.forEach((sec, i) => {
          sec.classList.remove("active", "inactive");
          sec.classList.add(i === index ? "active" : "inactive");
        });
        updateDots(index);

        if (updateHash) {
          const id = sections[index]?.id;
          if (id) history.replaceState(null, "", "#" + id);
        }
      }

      function showSectionById(id) {
        const idx = sections.findIndex((sec) => sec.id === id);
        if (idx !== -1) {
          current = idx;
          showSection(current);
        }
      }

      function buildDots() {
        if (!dotsContainer) return;
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

      function throttle() {
        isThrottled = true;
        setTimeout(() => (isThrottled = false), 650);
      }

      function scrollToContacto() {
        const contactoSection = document.getElementById("contacto");
        if (contactoSection) {
          contactoSection.scrollIntoView({ behavior: "smooth" });
        }
      }

      // Inicio (no pisar hash inicial)
      showSection(current, { updateHash: false });
      buildDots();

      // Soporte de hash inicial (ej: /index.html#contacto)
      const initialHash = location.hash.replace("#", "");
      if (initialHash) {
        showSectionById(initialHash);
        if (initialHash === "contacto") {
          setTimeout(scrollToContacto, 450);
        }
      }

      // Responder a cambios de hash
      window.addEventListener("hashchange", () => {
        const id = location.hash.replace("#", "");
        if (id) {
          showSectionById(id);
          if (id === "contacto") {
            setTimeout(scrollToContacto, 450);
          }
        }
      });

      // Interceptar clics internos con hash (cuando ya estamos en index)
      document.addEventListener("click", (e) => {
        const a = e.target.closest('a[href^="#"], a[href*="#"]');
        if (!a) return;

        const url = new URL(a.href, location.href);
        const targetId = url.hash.substring(1);
        if (!targetId) return;

        const pointsToIndex =
          url.pathname === "/" ||
          url.pathname.endsWith("/index.html") ||
          url.pathname === location.pathname;

        if (pointsToIndex) {
          e.preventDefault();
          showSectionById(targetId);
          if (targetId === "contacto") {
            setTimeout(scrollToContacto, 450);
          }
        }
      });

      // Navegación por rueda
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

      // Teclado (← →)
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

      // Swipe horizontal (móvil/tablet)
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

          const TH = 50; // umbral en px
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
    }
  }

  /* =============================
     CLIENTES: "Book Effect"
  ============================== */
  const pages = Array.from(document.querySelectorAll(".clients__page"));
  const btnPrev = document.querySelector(".clients__btn--prev");
  const btnNext = document.querySelector(".clients__btn--next");
  const pagerEl = document.getElementById("clientsPager");

  if (pages.length && btnPrev && btnNext && pagerEl) {
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
  }
});
