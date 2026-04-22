import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525567359470?text=Hola%2C%20quiero%20una%20p%C3%A1gina%20web%20que%20me%20ayude%20a%20generar%20m%C3%A1s%20clientes";

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
  const solutions = [
    {
      id: "presentacion",
      label: "Qué resuelve",
      title: "Una mejor presentación para tu negocio",
      description:
        "Una página bien hecha ayuda a que una persona entienda rápido qué ofreces, cómo ayudas y por qué debería confiar en ti desde el primer vistazo.",
      includes: [
        "Información clara desde el inicio",
        "Imagen más profesional para generar confianza",
        "Una presencia digital que ayuda a vender mejor",
      ],
    },
    {
      id: "orden",
      label: "Qué resuelve",
      title: "Orden y claridad en tu información",
      description:
        "Cuando la información está bien organizada, el cliente encuentra más fácil lo que necesita y tiene menos dudas antes de escribirte o pedir informes.",
      includes: [
        "Servicios, horarios y contacto más fáciles de encontrar",
        "Menos fricción antes del contacto",
        "Un recorrido más claro dentro de tu página",
      ],
    },
    {
      id: "resultado",
      label: "Qué resuelve",
      title: "Una herramienta útil para conseguir contactos",
      description:
        "La idea no es solo tener una página bonita, sino una página que ayude a tu negocio a recibir más preguntas, más mensajes y más oportunidades reales.",
      includes: [
        "Botones y llamadas a la acción mejor ubicados",
        "Camino más directo para que te contacten",
        "Presencia digital pensada para generar resultados",
      ],
    },
  ];

  function handleSolutionWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "solution_whatsapp",
      section: "solution",
      cta_name: "quiero_una_pagina_que_me_ayude_a_vender",
    });
  }

  function handleSolutionPackagesClick() {
    trackEvent("solution_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "solution",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section id="solucion" className="section">
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
              Una página web clara y profesional puede ayudarte a vender mejor
            </h2>

            <p className="section__text section__text--intro">
              La diferencia no está solo en “tener una página”, sino en tener
              una página que explique bien tu negocio, dé confianza y facilite
              que una persona pase de mirar a escribirte.
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
                Que tu negocio se vea profesional, se entienda rápido y tenga
                una presencia digital que sí ayude a generar oportunidades.
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
                Menos confusión, más confianza y un camino mucho más claro para
                que el cliente avance hacia el contacto.
              </p>
            </Motion.div>
          </Motion.aside>
        </Motion.div>

        <Motion.div
          className="solution-section__grid services services--enhanced"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={containerVariants}
        >
          {solutions.map((solution) => (
            <Motion.article
              key={solution.id}
              className="services__card services__card--enhanced"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <div className="services__top">
                <p className="services__label">{solution.label}</p>

                <div className="services__icon" aria-hidden="true">
                  <span className="services__icon-dot"></span>
                  <span className="services__icon-line"></span>
                </div>
              </div>

              <h3 className="services__title">{solution.title}</h3>
              <p className="services__text">{solution.description}</p>

              <ul className="services__list">
                {solution.includes.map((item) => (
                  <li key={item} className="services__item">
                    {item}
                  </li>
                ))}
              </ul>
            </Motion.article>
          ))}
        </Motion.div>

        <Motion.div
          className="solution-section__cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="solution-section__cta-text">
            Si quieres que tu negocio se vea más serio, se entienda mejor y
            tenga una página que sí ayude a generar clientes, podemos aterrizar
            la mejor opción para ti.
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
              Quiero una página que me ayude a vender
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