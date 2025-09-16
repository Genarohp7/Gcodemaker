document.addEventListener("DOMContentLoaded", () => {
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
});
