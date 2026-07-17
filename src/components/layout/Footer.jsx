import navigation from "../../data/navigation";

function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappHref = "https://wa.me/525567359470";
  const emailHref = "mailto:gehernandez@gcodemaker.com";

  return (
    <footer className="footer">
      <div className="footer__container footer__container--grid">
        <div className="footer__brand">
          <p className="footer__eyebrow">GCodemaker</p>
          <h2 className="footer__title">
            Páginas web para negocios que quieren verse mejor y conseguir más clientes
          </h2>
          <p className="footer__text">
            Desarrollo páginas para restaurantes, clínicas y negocios pequeños
            que necesitan una presencia más clara, más profesional y más útil
            para vender.
          </p>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">Explora</h3>
          <nav className="footer__nav" aria-label="Navegación secundaria">
            {navigation.map((item) => (
              <a key={item.id} href={item.href} className="footer__link">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">Contacto</h3>

          <div className="footer__contact">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="footer__link footer__link--strong"
            >
              WhatsApp
            </a>

            <a href={emailHref} className="footer__link">
              gehernandez@gcodemaker.com
            </a>
          </div>

          <div className="footer__mini-note">
            Ideal para negocios que necesitan una página nueva o mejorar la que ya tienen.
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__container footer__bottom-content">
          <p className="footer__copy">
            © {currentYear} GCodemaker. Todos los derechos reservados.
          </p>
          <div className="footer__legal">
            <a href="/privacy" className="footer__legal-link">
              Aviso de privacidad
            </a>
            <a href="/terms" className="footer__legal-link">
              Términos del servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
