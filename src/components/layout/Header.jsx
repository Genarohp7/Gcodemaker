import { useEffect, useMemo, useState } from "react";
import navigation from "../../data/navigation";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const navItems = useMemo(() => navigation, []);

  useEffect(() => {
    const sectionIds = navItems
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
  }, [navItems]);

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="header">
      <div className="header__container">
        <a href="#inicio" className="header__brand" onClick={handleCloseMenu}>
          <span className="header__logo">GCodemaker</span>
          <span className="header__brand-text">Desarrollo web</span>
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
          {navItems.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;

            return (
              <a
                key={item.id}
                href={item.href}
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
            href="#contacto"
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