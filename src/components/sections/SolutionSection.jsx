import { useState } from "react";
import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20una%20soluci%C3%B3n%20web%20profesional%20para%20mi%20negocio%20o%20proyecto";

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

function SolutionSection() {
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0);

  const solutions = [
    {
      id: "estrategia",
      label: "Qué resolvemos",
      title: "Una presencia digital pensada para tu tipo de proyecto",
      description:
        "No todos los negocios necesitan lo mismo. Por eso aterrizamos una solución web según tu etapa, tu oferta, tu mercado y la acción que quieres que haga tu cliente.",
      includes: [
        "Mensaje claro según tu negocio",
        "Estructura adaptada a tus objetivos",
        "Experiencia pensada para generar confianza",
      ],
    },
    {
      id: "google-seo",
      label: "Qué resolvemos",
      title: "Una base preparada para Google, SEO y campañas",
      description:
        "Tu sitio debe verse bien, pero también necesita una estructura que Google pueda entender y que sirva como punto de partida para indexación, SEO inicial y campañas digitales.",
      includes: [
        "Estructura clara para buscadores",
        "Base técnica para indexación en Google",
        "Contenido preparado para apoyar SEO y anuncios",
      ],
    },
    {
      id: "conversion",
      label: "Qué resolvemos",
      title: "Un recorrido más claro para convertir visitas en contactos",
      description:
        "La idea no es solo tener una página bonita. Diseñamos el recorrido para que las personas entiendan tu oferta, encuentren lo importante y sepan cómo contactarte.",
      includes: [
        "Llamadas a la acción mejor ubicadas",
        "Contacto directo por WhatsApp o formulario",
        "Menos fricción antes de pedir información",
      ],
    },
    {
      id: "crecimiento",
      label: "Qué resolvemos",
      title: "Una solución que puede crecer contigo",
      description:
        "Podemos empezar con una landing page profesional o avanzar hacia una solución más completa si tu negocio necesita más secciones, funcionalidades o una estructura escalable.",
      includes: [
        "Opciones para proyectos pequeños o más completos",
        "Sitios informativos, comerciales o personalizados",
        "Base flexible para futuras mejoras",
      ],
    },
  ];

  function handleSolutionWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "solution_whatsapp",
      section: "solution",
      cta_name: "quiero_una_solucion_web_profesional",
    });
  }

  function handleSolutionPackagesClick() {
    trackEvent("solution_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "solution",
      destination: "/promociones-paquetes",
    });
  }

  function handlePreviousSolution() {
    setActiveSolutionIndex((current) =>
      current === 0 ? solutions.length - 1 : current - 1
    );
  }

  function handleNextSolution() {
    setActiveSolutionIndex((current) =>
      current === solutions.length - 1 ? 0 : current + 1
    );
  }

  const activeSolution = solutions[activeSolutionIndex];

  return (
    <section id="solucion" className="section solution-section">
      <div className="section__container">
        <Motion.div
          className="services-section__header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Motion.div className="services-section__copy" variants={itemVariants}>
            <p className="section__eyebrow">La solución</p>

            <h2 className="section__title">
              Una solución web profesional puede ayudar a que tu negocio se vea
              mejor, se entienda más rápido y convierta más
            </h2>

            <p className="section__text section__text--intro">
              La diferencia no está solo en “tener una página”, sino en tener
              una presencia digital bien estructurada: clara para tus clientes,
              preparada para Google y diseñada para llevar al visitante hacia el
              contacto.
            </p>
          </Motion.div>

          <Motion.aside
            className="services-section__panel"
            variants={containerVariants}
          >
            <Motion.div
              className="services-section__panel-box"
              variants={itemVariants}
              whileHover={{ y: -3 }}
            >
              <span className="services-section__panel-label">
                Qué buscamos
              </span>
              <p className="services-section__panel-text">
                Que tu negocio o proyecto tenga una base digital seria, clara y
                funcional para presentarse mejor, captar interés y generar más
                oportunidades.
              </p>
            </Motion.div>

            <Motion.div
              className="services-section__panel-box"
              variants={itemVariants}
              whileHover={{ y: -3 }}
            >
              <span className="services-section__panel-label">
                Qué cambia cuando está bien hecho
              </span>
              <p className="services-section__panel-text">
                Menos confusión, más confianza, mejor estructura para Google y
                un camino mucho más directo para que el cliente avance hacia el
                contacto.
              </p>
            </Motion.div>
          </Motion.aside>
        </Motion.div>

        <Motion.div
          className="solution-section__carousel"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={containerVariants}
        >
          <Motion.article
            key={activeSolution.id}
            className="services__card services__card--enhanced solution-section__active-card"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4 }}
          >
            <div className="services__top">
              <p className="services__label">{activeSolution.label}</p>

              <div className="services__icon" aria-hidden="true">
                <span className="services__icon-dot"></span>
                <span className="services__icon-line"></span>
              </div>
            </div>

            <h3 className="services__title">{activeSolution.title}</h3>
            <p className="services__text">{activeSolution.description}</p>

            <ul className="services__list">
              {activeSolution.includes.map((item) => (
                <li key={item} className="services__item">
                  {item}
                </li>
              ))}
            </ul>
          </Motion.article>

          <div className="solution-section__carousel-controls">
            <button
              type="button"
              className="solution-section__carousel-btn"
              aria-label="Ver solución anterior"
              onClick={handlePreviousSolution}
            >
              ‹
            </button>

            <div className="solution-section__carousel-dots">
              {solutions.map((solution, index) => (
                <button
                  key={solution.id}
                  type="button"
                  className={`solution-section__carousel-dot ${
                    index === activeSolutionIndex
                      ? "solution-section__carousel-dot--active"
                      : ""
                  }`}
                  aria-label={`Ver solución ${index + 1}`}
                  aria-current={index === activeSolutionIndex}
                  onClick={() => setActiveSolutionIndex(index)}
                />
              ))}
            </div>

            <button
              type="button"
              className="solution-section__carousel-btn"
              aria-label="Ver solución siguiente"
              onClick={handleNextSolution}
            >
              ›
            </button>
          </div>
        </Motion.div>

        <Motion.div
          className="solution-section__cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="solution-section__cta-text">
            Si tu negocio necesita una página web, una landing para vender mejor
            o una solución digital más completa, podemos definir el camino
            correcto sin hacer algo genérico.
          </p>

          <div className="solution-section__cta-actions">
            <Motion.a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleSolutionWhatsappClick}
            >
              Quiero una solución web profesional
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handleSolutionPackagesClick}
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

export default SolutionSection;
