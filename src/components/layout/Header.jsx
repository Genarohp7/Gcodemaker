import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import navigation from "../../data/navigation";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const { pathname, hash } = useLocation();

  const isHomePage = pathname === "/";
  const isPackagesPage = pathname === "/promociones-paquetes";

  useEffect(() => {
    if (!isHomePage) return undefined;

    const sectionIds = navigation
      .map((item) => item.href.replace("#", ""))
      .filter(Boolean);

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

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  function getSectionHref(hashHref) {
    return isHomePage ? hashHref : `/${hashHref}`;
  }

  const brandHref = isHomePage ? "#inicio" : "/";
  const packagesHref = "/promociones-paquetes";
  const contactHref = isHomePage ? "#contacto" : "/#contacto";

  const currentActiveSection = isPackagesPage
    ? "promociones-paquetes"
    : isHomePage && hash
      ? hash.replace("#", "")
      : activeSection;

  return (
    <header className="header">
      <div className="header__container">
        <a href={brandHref} className="header__brand" onClick={handleCloseMenu}>
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
          {navigation.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = isHomePage && currentActiveSection === sectionId;

            return (
              <a
                key={item.id}
                href={getSectionHref(item.href)}
                className={`header__link ${
                  isActive ? "header__link--active" : ""
                }`}
                onClick={handleCloseMenu}
                aria-current={isActive ? "true" : "false"}
              >
                {item.label}
              </a>
            );
          })}

          <a
            href={packagesHref}
            className={`header__link ${
              isPackagesPage ? "header__link--active" : ""
            }`}
            onClick={handleCloseMenu}
            aria-current={isPackagesPage ? "true" : "false"}
          >
            Promociones y paquetes
          </a>

          <a
            href={contactHref}
            className="button button--primary button--header"
            onClick={handleCloseMenu}
          >
            Contactar
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;