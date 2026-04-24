import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20mejorar%20la%20presencia%20digital%20de%20mi%20negocio%20o%20proyecto";

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

function ProblemSection() {
  const problems = [
    {
      id: "sin-presencia-profesional",
      label: "Problema común",
      title: "Tu negocio no tiene una presencia digital que lo respalde",
      description:
        "Si una persona te busca y no encuentra una página clara, profesional y fácil de entender, es más probable que termine confiando en otra opción mejor presentada.",
      includes: [
        "Pierdes oportunidades de contacto",
        "Tu negocio puede verse menos formal de lo que realmente es",
        "Dependes demasiado de recomendaciones, redes o medios que no controlas",
      ],
    },
    {
      id: "solo-redes",
      label: "Problema común",
      title: "Dependes solo de redes sociales para explicar lo que haces",
      description:
        "Las redes ayudan, pero no siempre son suficientes para presentar bien tu oferta, ordenar tu información y generar confianza cuando alguien quiere decidir rápido.",
      includes: [
        "La información importante se pierde entre publicaciones",
        "No siempre se encuentran rápido servicios, precios, ubicación o contacto",
        "Tu presencia digital depende de plataformas ajenas",
      ],
    },
    {
      id: "google-seo",
      label: "Problema común",
      title: "Tu negocio no está preparado para trabajar bien en Google",
      description:
        "Tener presencia digital no es solo verse bonito. También necesitas una base correcta para que Google pueda entender tu sitio, indexarlo y usarlo como apoyo para SEO o campañas.",
      includes: [
        "Google puede entender poco o mal tu página",
        "Tu sitio no tiene una estructura clara para SEO inicial",
        "Las campañas pueden perder fuerza si la página no comunica bien",
      ],
    },
    {
      id: "conversion",
      label: "Problema común",
      title: "Recibes visitas, pero no las conviertes en contactos reales",
      description:
        "Muchas veces el problema no es el servicio, sino que la gente no entiende rápido qué ofreces, por qué confiar en ti o cómo contactarte sin complicarse.",
      includes: [
        "La información importante no está clara",
        "El cliente no encuentra un camino fácil para escribirte",
        "Cada duda no resuelta puede convertirse en una venta perdida",
      ],
    },
  ];

  function handleProblemWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "problem_whatsapp",
      section: "problem",
      cta_name: "quiero_mejorar_mi_presencia_digital",
    });
  }

  function handleProblemPackagesClick() {
    trackEvent("problem_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "problem",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section id="problema" className="section section--alt">
      <div className="section__container">
        <Motion.div
          className="services-section__header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Motion.div className="services-section__copy" variants={itemVariants}>
            <p className="section__eyebrow">El problema</p>

            <h2 className="section__title">
              Muchos negocios no pierden oportunidades por lo que venden, sino
              por cómo se presentan en internet
            </h2>

            <p className="section__text section__text--intro">
              Hoy una página web no solo debe verse bien. Debe explicar tu
              oferta, generar confianza, ayudar a que Google entienda tu negocio
              y llevar al visitante hacia una acción clara: escribirte, pedir
              información o comprar.
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
                Lo que suele pasar
              </span>
              <p className="services-section__panel-text">
                El negocio sí tiene valor, pero su presencia digital no ayuda lo
                suficiente a explicar, convencer ni convertir visitas en
                clientes.
              </p>
            </Motion.div>

            <Motion.div
              className="services-section__panel-box"
              variants={itemVariants}
              whileHover={{ y: -3 }}
            >
              <span className="services-section__panel-label">
                Lo que cuesta seguir igual
              </span>
              <p className="services-section__panel-text">
                Cada persona que entra, no entiende rápido y se va, es una
                oportunidad que otro negocio mejor presentado sí puede
                aprovechar.
              </p>
            </Motion.div>
          </Motion.aside>
        </Motion.div>

        <Motion.div
          className="problem-section__grid services services--enhanced"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={containerVariants}
        >
          {problems.map((problem) => (
            <Motion.article
              key={problem.id}
              className="services__card services__card--enhanced"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <div className="services__top">
                <p className="services__label">{problem.label}</p>

                <div className="services__icon" aria-hidden="true">
                  <span className="services__icon-dot"></span>
                  <span className="services__icon-line"></span>
                </div>
              </div>

              <h3 className="services__title">{problem.title}</h3>
              <p className="services__text">{problem.description}</p>

              <ul className="services__list">
                {problem.includes.map((item) => (
                  <li key={item} className="services__item">
                    {item}
                  </li>
                ))}
              </ul>
            </Motion.article>
          ))}
        </Motion.div>

        <Motion.div
          className="problem-section__cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="problem-section__cta-text">
            Si tu negocio ya tiene algo valioso que ofrecer, pero tu presencia
            digital no lo está comunicando con claridad, podemos corregirlo.
          </p>

          <div className="problem-section__cta-actions">
            <Motion.a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleProblemWhatsappClick}
            >
              Quiero mejorar mi presencia digital
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handleProblemPackagesClick}
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

export default ProblemSection;