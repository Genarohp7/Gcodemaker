import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

function getNavSectionId(sectionId) {
  const sectionMap = {
    problema: "servicios",
    solucion: "servicios",
    servicios: "servicios",
    proceso: "servicios",
  };

  return sectionMap[sectionId] || sectionId;
}

const homeSectionIds = [
  "inicio",
  "problema",
  "solucion",
  "servicios",
  "proyectos",
  "sobre-mi",
  "proceso",
  "demo-ia",
  "contacto",
];

const HEADER_SECTION_OFFSET = 24;

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [isScrolled, setIsScrolled] = useState(false);
  const logoSrc = `${import.meta.env.BASE_URL}logo-gcodemaker.png`;

  const { pathname, hash } = useLocation();

  const isHomePage = pathname === "/";
  const isPackagesPage = pathname === "/promociones-paquetes";

  function scrollToHomeSection(targetElement, sectionId) {
    const headerHeight =
      document.querySelector(".header")?.getBoundingClientRect().height || 0;
    const targetTop =
      sectionId === "inicio"
        ? 0
        : window.scrollY +
          targetElement.getBoundingClientRect().top -
          headerHeight -
          HEADER_SECTION_OFFSET;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (!isHomePage) return undefined;

    const sections = homeSectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    function updateHeaderState() {
      const headerOffset =
        window.innerHeight <= 760
          ? window.innerHeight * 0.32
          : window.innerHeight * 0.28;
      const currentSection =
        sections
          .map((section) => ({
            id: section.id,
            distance: section.getBoundingClientRect().top - headerOffset,
          }))
          .filter((section) => section.distance <= 0)
          .sort((a, b) => b.distance - a.distance)[0] || sections[0];

      setActiveSection(getNavSectionId(currentSection.id));
      setIsScrolled(window.scrollY > 12);
    }

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, [isHomePage]);

  useEffect(() => {
    if (isHomePage) return undefined;

    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage || !hash) return;

    const targetId = hash.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (!targetElement) return;

    requestAnimationFrame(() => {
      setActiveSection(getNavSectionId(targetId));
      scrollToHomeSection(targetElement, targetId);
    });
  }, [isHomePage, hash]);

  function handleSectionClick(event, sectionId) {
    handleCloseMenu(sectionId);

    if (!isHomePage) return;

    const targetElement = document.getElementById(sectionId);
    if (!targetElement) return;

    event.preventDefault();
    window.history.pushState(null, "", `#${sectionId}`);
    setActiveSection(getNavSectionId(sectionId));
    scrollToHomeSection(targetElement, sectionId);
  }

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function handleCloseMenu(sectionId) {
    if (sectionId) {
      setActiveSection(getNavSectionId(sectionId));
    }

    setIsMenuOpen(false);
  }

  function getSectionHref(sectionHash) {
    return isHomePage ? sectionHash : `/${sectionHash}`;
  }

  const currentActiveSection = isPackagesPage
    ? "promociones-paquetes"
    : activeSection;

  return (
    <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
      <div className="header__container">
        {isHomePage ? (
          <a
            href="#inicio"
            className="header__brand"
            onClick={(event) => handleSectionClick(event, "inicio")}
          >
            <img
              src={logoSrc}
              alt="Logo de GCodemaker"
              className="header__logo-image"
            />

            <span className="header__brand-copy">
              <span className="header__logo">GCodemaker</span>
              <span className="header__brand-text">Desarrollo web</span>
            </span>
          </a>
        ) : (
          <Link
            to="/"
            viewTransition
            className="header__brand"
            onClick={() => handleCloseMenu("inicio")}
          >
            <img
              src={logoSrc}
              alt="Logo de GCodemaker"
              className="header__logo-image"
            />

            <span className="header__brand-copy">
              <span className="header__logo">GCodemaker</span>
              <span className="header__brand-text">Desarrollo web</span>
            </span>
          </Link>
        )}

        <button
          type="button"
          className={`header__toggle ${
            isMenuOpen ? "header__toggle--active" : ""
          }`}
          aria-label="Abrir o cerrar menú"
          aria-expanded={isMenuOpen}
          onClick={handleToggleMenu}
        >
          <span className="header__bar"></span>
          <span className="header__bar"></span>
          <span className="header__bar"></span>
        </button>

        <nav
          className={`header__nav ${
            isMenuOpen ? "header__nav--active" : ""
          }`}
        >
          <a
            href={getSectionHref("#inicio")}
            className={`header__link ${
              isHomePage && currentActiveSection === "inicio"
                ? "header__link--active"
                : ""
            }`}
            onClick={(event) => handleSectionClick(event, "inicio")}
            aria-current={
              isHomePage && currentActiveSection === "inicio" ? "true" : "false"
            }
          >
            Inicio
          </a>

          <a
            href={getSectionHref("#solucion")}
            className={`header__link ${
              isHomePage && currentActiveSection === "servicios"
                ? "header__link--active"
                : ""
            }`}
            onClick={(event) => handleSectionClick(event, "solucion")}
            aria-current={
              isHomePage && currentActiveSection === "servicios"
                ? "true"
                : "false"
            }
          >
            Soluciones
          </a>

          <a
            href={getSectionHref("#proyectos")}
            className={`header__link ${
              isHomePage && currentActiveSection === "proyectos"
                ? "header__link--active"
                : ""
            }`}
            onClick={(event) => handleSectionClick(event, "proyectos")}
            aria-current={
              isHomePage && currentActiveSection === "proyectos"
                ? "true"
                : "false"
            }
          >
            Ejemplos
          </a>

          <a
            href={getSectionHref("#sobre-mi")}
            className={`header__link ${
              isHomePage && currentActiveSection === "sobre-mi"
                ? "header__link--active"
                : ""
            }`}
            onClick={(event) => handleSectionClick(event, "sobre-mi")}
            aria-current={
              isHomePage && currentActiveSection === "sobre-mi"
                ? "true"
                : "false"
            }
          >
            Quién hará tu página
          </a>

          <NavLink
            to="/promociones-paquetes"
            viewTransition
            className={({ isActive }) =>
              `header__link ${isActive ? "header__link--active" : ""}`
            }
            onClick={() => handleCloseMenu("promociones-paquetes")}
          >
            Promociones y paquetes
          </NavLink>

          <a
            href={getSectionHref("#demo-ia")}
            className={`header__link ${
              isHomePage && currentActiveSection === "demo-ia"
                ? "header__link--active"
                : ""
            }`}
            onClick={(event) => handleSectionClick(event, "demo-ia")}
            aria-current={
              isHomePage && currentActiveSection === "demo-ia" ? "true" : "false"
            }
          >
            Demo IA
          </a>

          {isHomePage ? (
            <a
              href="#contacto"
              className={`button button--primary button--header ${
                currentActiveSection === "contacto" ? "button--header-active" : ""
              }`}
              onClick={(event) => handleSectionClick(event, "contacto")}
            >
              Contactar
            </a>
          ) : (
            <Link
              to="/#contacto"
              viewTransition
              className="button button--primary button--header"
              onClick={() => handleCloseMenu("contacto")}
            >
              Contactar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;

