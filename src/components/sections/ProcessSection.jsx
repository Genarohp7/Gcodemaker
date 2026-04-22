import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525567359470?text=Hola%2C%20quiero%20revisar%20el%20proceso%20para%20crear%20la%20p%C3%A1gina%20web%20de%20mi%20negocio";

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
      id: "contacto",
      number: "01",
      title: "Me cuentas qué necesita tu negocio",
      text: "Primero revisamos qué quieres lograr, qué tipo de negocio tienes y cuál es la meta principal: verte mejor, generar confianza o conseguir más contactos.",
    },
    {
      id: "propuesta",
      number: "02",
      title: "Definimos la mejor opción para ti",
      text: "Después aterrizamos la mejor ruta según tu momento, tu presupuesto y el tipo de página que más sentido tenga para ayudarte a vender mejor.",
    },
    {
      id: "desarrollo",
      number: "03",
      title: "Desarrollo, ajusto y dejamos todo listo",
      text: "Construyo la página, hacemos los ajustes necesarios y la dejamos preparada para que tu negocio tenga una presencia digital más clara, más seria y más útil.",
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
            Un proceso claro para que tu página avance sin complicaciones raras
          </Motion.h2>

          <Motion.p
            className="section__text section__text--intro"
            variants={itemVariants}
          >
            La idea es que todo sea claro desde el principio: entender qué
            necesita tu negocio, definir la mejor solución y construir una página
            que se vea mejor, se entienda mejor y ayude más al negocio.
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
            Podemos empezar revisando qué necesita tu negocio y cuál opción te
            conviene más.
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