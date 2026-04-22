function ContactSection() {
  const emailHref = "mailto:gehernandez@gcodemaker.com";
  const whatsappHref = "https://wa.me/525522737432";

  const handleWhatsAppClick = () => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "whatsapp_click", {
        event_category: "contacto",
        event_label: "Solicitar por WhatsApp",
        link_url: whatsappHref,
        contact_method: "whatsapp",
        click_origin: "contact_section",
        cta_name: "solicitar_por_whatsapp",
      });
    }
  };

  const handleEmailClick = () => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "contact_email_click", {
        event_category: "contacto",
        event_label: "Solicitar por correo",
        link_url: emailHref,
        contact_method: "email",
        click_origin: "contact_section",
        cta_name: "solicitar_por_correo",
      });
    }
  };

  return (
    <section id="contacto" className="section contact-section">
      <div className="section__container section__container--narrow">
        <div className="contact-section__box">
          <p className="section__eyebrow">Contacto</p>

          <h2 className="section__title">
            Si quieres una página que haga ver mejor tu negocio y te ayude a
            conseguir más clientes, hablemos
          </h2>

          <p className="section__text">
            Si tu negocio necesita una página nueva o una mejora para verse más
            claro, más confiable y más profesional, este es un buen momento para
            dar el siguiente paso.
          </p>

          <p className="section__text">
            La idea no es solo entregarte una página bonita, sino una página que
            ayude a explicar mejor lo que ofreces, dé confianza y facilite que
            tus clientes te contacten.
          </p>

          <div className="contact-section__highlights">
            <div className="contact-section__highlight">
              <span className="contact-section__highlight-label">
                Respuesta directa
              </span>
              <p className="contact-section__highlight-text">
                Podemos empezar por WhatsApp para revisar qué necesita tu negocio
                y decirte cuál opción te conviene más.
              </p>
            </div>

            <div className="contact-section__highlight">
              <span className="contact-section__highlight-label">
                Enfoque realista
              </span>
              <p className="contact-section__highlight-text">
                Si necesitas algo sencillo para arrancar o una solución más
                completa, lo aterrizamos según tu giro y tu momento actual.
              </p>
            </div>
          </div>

          <div className="contact-section__actions">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              onClick={handleWhatsAppClick}
            >
              Solicitar por WhatsApp
            </a>

            <a
              href={emailHref}
              className="button button--secondary"
              onClick={handleEmailClick}
            >
              Solicitar por correo
            </a>
          </div>

          <div className="contact-section__note">
            <span className="contact-section__note-label">Ideal para</span>
            <p className="contact-section__note-text">
              Negocios que quieren empezar con una página más profesional o
              mejorar la que ya tienen para transmitir más confianza y vender
              mejor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;