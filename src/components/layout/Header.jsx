import { useState } from "react";
import navigation from "../../data/navigation";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="header">
      <div className="header__container">
        <a href="#inicio" className="header__logo" onClick={handleCloseMenu}>
          GCodemaker
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
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="header__link"
              onClick={handleCloseMenu}
            >
              {item.label}
            </a>
          ))}

          <a
            href="https://github.com/Genarohp7"
            target="_blank"
            rel="noreferrer"
            className="header__link header__link--highlight"
            onClick={handleCloseMenu}
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;