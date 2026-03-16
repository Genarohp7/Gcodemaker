function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__text">
          © {currentYear} GCodemaker. Desarrollo web con enfoque claro, funcional
          y profesional.
        </p>

        <a
          href="https://github.com/Genarohp7"
          target="_blank"
          rel="noreferrer"
          className="footer__link"
        >
          Ver GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;