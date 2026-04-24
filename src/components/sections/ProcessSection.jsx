import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20revisar%20una%20soluci%C3%B3n%20web%20profesional%20para%20mi%20negocio%20o%20proyecto%20digital";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function ProcessSection() {
  const steps = [
    {
      id: "diagnostico",
      number: "01",
      title: "Revisamos qué necesita tu negocio o proyecto",
      text: "Primero entendemos qué quieres lograr: presentar mejor tu negocio, conseguir más contactos, preparar una campaña, aparecer en Google o crear una solución web más completa.",
    },
    {
      id: "ruta",
      number: "02",
      title: "Definimos la mejor ruta para avanzar",
      text: "No todos necesitan lo mismo. Aterrizamos si conviene una landing page, un sitio profesional, una mejora sobre tu página actual o una solución más robusta según tu etapa y presupuesto.",
    },
    {
      id: "desarrollo",
      number: "03",
      title: "Desarrollo, optimización y publicación",
      text: "Construimos la solución, hacemos ajustes y dejamos una base profesional con estructura clara, contacto directo, SEO inicial e indexación preparada para Google y futuras campañas.",
    },
  ];

  function handleProcessWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "process_whatsapp",
      section: "process",
      cta_name: "quiero_revisar_mi_proyecto",
    });
  }

  function handleProcessPackagesClick() {
    trackEvent("process_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "process",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section id="proceso" className="section section--alt">
      <div className="section__container">
        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Motion.p className="section__eyebrow" variants={itemVariants}>
            Cómo trabajamos
          </Motion.p>

          <Motion.h2 className="section__title" variants={itemVariants}>
            Un proceso claro para convertir tu idea en una solución web funcional
          </Motion.h2>

          <Motion.p
            className="section__text section__text--intro"
            variants={itemVariants}
          >
            La idea es que avances sin enredos técnicos: revisamos qué necesita
            tu negocio, definimos la solución correcta y construimos una
            presencia digital clara, profesional y preparada para generar más
            oportunidades.
          </Motion.p>
        </Motion.div>

        <Motion.div
          className="process"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={containerVariants}
        >
          {steps.map((step) => (
            <Motion.article
              key={step.id}
              className="process__step"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <span className="process__number">{step.number}</span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__text">{step.text}</p>
            </Motion.article>
          ))}
        </Motion.div>

        <Motion.div
          className="process-section__cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="process-section__cta-text">
            No necesitas llegar con todo resuelto ni saber términos técnicos.
            Podemos empezar revisando tu caso y definir si necesitas una página,
            una landing, una mejora sobre tu sitio actual o algo más completo.
          </p>

          <div className="process-section__cta-actions">
            <Motion.a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleProcessWhatsappClick}
            >
              Quiero revisar mi proyecto
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handleProcessPackagesClick}
              >
                Ver promoción y paquetes
              </Link>
            </Motion.div>
          </div>
        </Motion.div>
      </div>
    </section>
  );
}

export default ProcessSection;