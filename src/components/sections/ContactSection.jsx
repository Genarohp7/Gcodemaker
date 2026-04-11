function ContactSection() {
 const emailHref = "mailto:gehernandez@gcodemaker.com";
const whatsappHref = "https://wa.me/525567359470";

  return (
    <section id="contacto" className="section contact-section">
      <div className="section__container section__container--narrow">
        <div className="contact-section__box">
          <p className="section__eyebrow">Contacto</p>

          <h2 className="section__title">
            Solicita tu página web y empieza a darle a tu negocio una presencia más profesional
          </h2>

          <p className="section__text">
            Si tu negocio necesita una página nueva o una mejora para verse más
            claro, más confiable y más profesional, este es un buen momento para
            dar el siguiente paso.
          </p>

          <p className="section__text">
            Puedo ayudarte a crear una página pensada para que tus clientes
            entiendan rápido lo que ofreces, confíen más en tu negocio y puedan
            contactarte con facilidad.
          </p>

          <div className="contact-section__actions">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
            >
              Solicitar por WhatsApp
            </a>

            <a
              href={emailHref}
              className="button button--secondary"
            >
              Solicitar por correo
            </a>
          </div>

          <div className="contact-section__note">
            <span className="contact-section__note-label">Importante</span>
            <p className="contact-section__note-text">
              Reemplaza <strong>+52 55 22737432</strong> y <strong>gehernandez@gcodemaker.com.mx</strong>
              {" "}por tus datos reales para dejar esta sección lista para conversión.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;