import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20mejorar%20la%20presencia%20digital%20de%20mi%20negocio";

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
      id: "sin-pagina",
      label: "Problema común",
      title: "Tu negocio no tiene una página web que lo respalde",
      description:
        "Si una persona te busca y no encuentra una página clara y profesional, es más fácil que termine confiando en otra opción que sí se ve más seria.",
      includes: [
        "Pierdes oportunidades de contacto",
        "Tu negocio se percibe menos formal",
        "Dependes demasiado de otros medios para que te encuentren",
      ],
    },
    {
      id: "solo-redes",
      label: "Problema común",
      title: "Dependes solo de redes sociales para vender",
      description:
        "Las redes ayudan, pero no deberían cargar todo el peso de tu presencia digital. La información se pierde, cambia rápido y no siempre transmite confianza.",
      includes: [
        "La información se pierde entre publicaciones",
        "No siempre se encuentran rápido horarios, servicios o contacto",
        "Tu presencia digital depende de una plataforma ajena",
      ],
    },
    {
      id: "poca-confianza",
      label: "Problema común",
      title: "Tu negocio puede estar dando menos confianza de la que merece",
      description:
        "Aunque ofrezcas un buen servicio, una presencia digital débil puede hacer que la gente dude antes de escribirte, llamarte o pedir información.",
      includes: [
        "La imagen del negocio se ve poco profesional",
        "Cuesta más generar seguridad en clientes nuevos",
        "Una mala primera impresión puede alejar ventas",
      ],
    },
    {
      id: "clientes-perdidos",
      label: "Problema común",
      title: "Estás perdiendo clientes sin notarlo",
      description:
        "Muchas veces el problema no es lo que vendes, sino que la gente no entiende rápido qué haces, dónde estás o cómo puede contactarte.",
      includes: [
        "La información importante no está clara",
        "El cliente no encuentra un camino fácil para contactarte",
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
              Muchos negocios no venden menos por su servicio, sino por cómo se
              presentan en internet
            </h2>

            <p className="section__text section__text--intro">
              Cuando un negocio no se ve claro, profesional y fácil de
              contactar, pierde confianza, clics y oportunidades. Y eso termina
              pegándole directo a los mensajes, las llamadas y las ventas.
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
                El negocio sí funciona, pero su presencia digital no ayuda lo
                suficiente a convencer, explicar ni convertir visitas en
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
                oportunidad que otro negocio sí puede aprovechar.
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
            Si sientes que tu negocio ya hace bien su trabajo pero su presencia
            digital no está ayudando a vender, podemos corregirlo.
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