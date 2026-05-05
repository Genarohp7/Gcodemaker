import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20p%C3%A1gina%20web%20con%20asistente%20IA%20integrado%20para%20mi%20negocio";

function FinalCtaSection() {
  function handleFinalWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "final_cta_whatsapp",
      section: "final_cta",
      cta_name: "quiero_hablar_por_whatsapp",
    });
  }

  function handleFinalPackagesClick() {
    trackEvent("final_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "final_cta",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="section__container">
        <div className="final-cta__box">
          <div className="final-cta__content">
            <p className="final-cta__eyebrow">Da el siguiente paso</p>

            <h2 id="final-cta-title" className="final-cta__title">
              Si tu negocio necesita una web más profesional y atención más
              inteligente, este es un buen momento para construirlo bien
            </h2>

            <p className="final-cta__text">
              Podemos empezar con una promoción de arranque, mejorar tu sitio
              actual, integrar un asistente IA o definir una solución web más
              completa según tu proyecto. Lo importante es que tu presencia
              digital deje de ser una idea pendiente y se convierta en una
              herramienta real para generar confianza, aparecer mejor preparado
              en Google y conseguir más contactos.
            </p>
          </div>

          <div className="final-cta__actions">
            <Motion.a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleFinalWhatsappClick}
            >
              Hablar sobre web con IA
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handleFinalPackagesClick}
              >
                Ver promoción y paquetes
              </Link>
            </Motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;
