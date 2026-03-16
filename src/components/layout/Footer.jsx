import navigation from "../../data/navigation";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container footer__container--grid">
        <div className="footer__brand">
          <p className="footer__eyebrow">GCodemaker</p>
          <h2 className="footer__title">Desarrollo web con enfoque claro y funcional</h2>
          <p className="footer__text">
            Portafolio personal en evolución, construido para presentar mejor mi
            trabajo, mi enfoque y la forma en la que desarrollo soluciones web
            para negocios y proyectos que necesitan una presencia digital más
            profesional.
          </p>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">Navegación</h3>
          <nav className="footer__nav" aria-label="Navegación secundaria">
            {navigation.map((item) => (
              <a key={item.id} href={item.href} className="footer__link">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">Tecnologías</h3>
          <div className="footer__stack">
            <span className="footer__stack-item">HTML</span>
            <span className="footer__stack-item">CSS</span>
            <span className="footer__stack-item">JavaScript</span>
            <span className="footer__stack-item">React</span>
            <span className="footer__stack-item">Node</span>
          </div>

          <a
            href="https://github.com/Genarohp7"
            target="_blank"
            rel="noreferrer"
            className="footer__link footer__link--strong"
          >
            Ver GitHub
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__container footer__bottom-content">
          <p className="footer__copy">
            © {currentYear} GCodemaker. Todos los derechos reservados.
          </p>
          <p className="footer__signature">
            Hecho con React, criterio y un saludable desprecio por el caos visual.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;