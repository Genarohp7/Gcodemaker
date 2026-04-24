function ContactSection() {
  const emailHref = "mailto:gehernandez@gcodemaker.com";
  const whatsappHref =
    "https://wa.me/525522737432?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20soluci%C3%B3n%20web%20profesional%20para%20mi%20negocio%20o%20proyecto";

  const handleWhatsAppClick = () => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "whatsapp_click", {
        event_category: "contacto",
        event_label: "Solicitar solución web por WhatsApp",
        link_url: whatsappHref,
        contact_method: "whatsapp",
        click_origin: "contact_section",
        cta_name: "solicitar_solucion_web_por_whatsapp",
      });
    }
  };

  const handleEmailClick = () => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "contact_email_click", {
        event_category: "contacto",
        event_label: "Solicitar información por correo",
        link_url: emailHref,
        contact_method: "email",
        click_origin: "contact_section",
        cta_name: "solicitar_informacion_por_correo",
      });
    }
  };

  return (
    <section id="contacto" className="section contact-section">
      <div className="section__container section__container--narrow">
        <div className="contact-section__box">
          <p className="section__eyebrow">Contacto</p>

          <h2 className="section__title">
            Si tu negocio necesita una presencia digital más profesional,
            hablemos
          </h2>

          <p className="section__text">
            Podemos ayudarte a crear una página web, una landing comercial o una
            solución digital más completa según el tamaño de tu proyecto, tu
            objetivo y la etapa en la que se encuentra tu negocio.
          </p>

          <p className="section__text">
            La idea no es solo entregarte algo que se vea bien, sino construir
            una base digital clara, confiable y preparada para Google, SEO
            inicial, campañas y contacto real con tus clientes.
          </p>

          <div className="contact-section__highlights">
            <div className="contact-section__highlight">
              <span className="contact-section__highlight-label">
                Diagnóstico directo
              </span>
              <p className="contact-section__highlight-text">
                Podemos empezar por WhatsApp para revisar qué necesitas y
                definir si te conviene una página, una landing, una mejora sobre
                tu sitio actual o una solución más completa.
              </p>
            </div>

            <div className="contact-section__highlight">
              <span className="contact-section__highlight-label">
                Enfoque profesional
              </span>
              <p className="contact-section__highlight-text">
                Aterrizamos la solución según tu negocio, tu presupuesto y lo que
                realmente necesitas lograr: presencia, confianza, visibilidad o
                más oportunidades de contacto.
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
              Negocios, marcas o proyectos digitales que quieren verse más
              profesionales, explicar mejor su oferta, aparecer mejor preparados
              en Google y convertir visitas en contactos reales.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;