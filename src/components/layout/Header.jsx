import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const { pathname, hash } = useLocation();

  const isHomePage = pathname === "/";
  const isPackagesPage = pathname === "/promociones-paquetes";

  useEffect(() => {
    if (!isHomePage) return undefined;

    const sectionIds = ["inicio", "servicios", "proyectos", "sobre-mi", "contacto"];

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage || !hash) return;

    const targetId = hash.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (!targetElement) return;

    requestAnimationFrame(() => {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [isHomePage, hash]);

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  function getSectionHref(sectionHash) {
    return isHomePage ? sectionHash : `/${sectionHash}`;
  }

  const currentActiveSection = isPackagesPage
    ? "promociones-paquetes"
    : isHomePage && hash
      ? hash.replace("#", "")
      : activeSection;

  return (
    <header className="header">
      <div className="header__container">
        {isHomePage ? (
          <a href="#inicio" className="header__brand" onClick={handleCloseMenu}>
            <img
              src="/logo-gcodemaker.png"
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
            onClick={handleCloseMenu}
          >
            <img
              src="/logo-gcodemaker.png"
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
            onClick={handleCloseMenu}
            aria-current={
              isHomePage && currentActiveSection === "inicio" ? "true" : "false"
            }
          >
            Inicio
          </a>

          <a
            href={getSectionHref("#servicios")}
            className={`header__link ${
              isHomePage && currentActiveSection === "servicios"
                ? "header__link--active"
                : ""
            }`}
            onClick={handleCloseMenu}
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
            onClick={handleCloseMenu}
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
            onClick={handleCloseMenu}
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
            onClick={handleCloseMenu}
          >
            Promociones y paquetes
          </NavLink>

          {isHomePage ? (
            <a
              href="#contacto"
              className="button button--primary button--header"
              onClick={handleCloseMenu}
            >
              Contactar
            </a>
          ) : (
            <Link
              to="/#contacto"
              viewTransition
              className="button button--primary button--header"
              onClick={handleCloseMenu}
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