function ContactSection() {
  return (
    <section id="contacto" className="section contact-section">
      <div className="section__container section__container--narrow">
        <div className="contact-section__box">
          <p className="section__eyebrow">Contacto</p>

          <h2 className="section__title">
            Si tienes una idea, un negocio o un sitio que necesita mejorar, hablemos
          </h2>

          <p className="section__text">
            Me interesa colaborar en proyectos que necesiten una presencia
            digital más clara, más profesional y mejor estructurada. Si estás
            buscando una landing page, un sitio informativo o una mejora para tu
            página actual, podemos revisar qué necesitas y cómo resolverlo.
          </p>

          <p className="section__text">
            Esta nueva versión del portafolio sigue en construcción, pero ya
            puedes contactarme para conversar sobre tu proyecto.
          </p>

          <div className="contact-section__actions">
            <a
              href="mailto:genaro@example.com"
              className="button button--primary"
            >
              Enviar correo
            </a>

            <a
              href="https://github.com/Genarohp7"
              target="_blank"
              rel="noreferrer"
              className="button button--secondary"
            >
              Ver GitHub
            </a>
          </div>

          <div className="contact-section__note">
            <span className="contact-section__note-label">Nota</span>
            <p className="contact-section__note-text">
              Más adelante esta sección tendrá formulario real y mejor integración
              de contacto. Por ahora, el correo funciona como vía directa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;