import { motion as Motion } from "motion/react";

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
      title: "Tu negocio no tiene página web",
      description:
        "Si una persona te busca y no encuentra una página clara y profesional, es más fácil que termine confiando en otra opción.",
      includes: [
        "Pierdes oportunidades de contacto",
        "Tu negocio se percibe menos formal",
        "Dependes de que te encuentren por otros medios",
      ],
    },
    {
      id: "solo-redes",
      label: "Problema común",
      title: "Dependes solo de redes sociales",
      description:
        "Las redes ayudan, pero no deberían ser el único lugar donde un cliente conoce tu negocio. No controlas del todo cómo te ven ni cómo encuentran tu información.",
      includes: [
        "La información se pierde entre publicaciones",
        "No siempre es fácil encontrar horarios, servicios o contacto",
        "Tu presencia digital depende de una plataforma ajena",
      ],
    },
    {
      id: "poca-confianza",
      label: "Problema común",
      title: "Tu negocio no transmite suficiente confianza",
      description:
        "Aunque ofrezcas algo bueno, una presencia digital débil puede hacer que una persona dude antes de escribirte, llamarte o visitarte.",
      includes: [
        "La imagen del negocio se ve poco profesional",
        "Cuesta más generar seguridad en clientes nuevos",
        "Una mala primera impresión puede alejar ventas",
      ],
    },
    {
      id: "clientes-perdidos",
      label: "Problema común",
      title: "Estás perdiendo clientes sin darte cuenta",
      description:
        "Muchas veces el problema no es el servicio, sino que la gente no entiende rápido qué haces, dónde estás o cómo puede contactarte.",
      includes: [
        "La información importante no está clara",
        "El cliente no encuentra un camino fácil para contactarte",
        "Cada duda no resuelta puede convertirse en una venta perdida",
      ],
    },
  ];

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
              Muchos negocios no tienen un mal servicio, pero sí una mala
              presencia digital
            </h2>

            <p className="section__text section__text--intro">
              Cuando un negocio no se presenta bien en internet, pierde
              claridad, confianza y oportunidades. Y eso termina afectando
              contactos, ventas y crecimiento.
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
                Lo importante
              </span>
              <p className="services-section__panel-text">
                Una buena página no solo sirve para verse mejor. Sirve para dar
                confianza, ordenar la información y facilitar que una persona te
                contacte.
              </p>
            </Motion.div>
          </Motion.aside>
        </Motion.div>

        <Motion.div
          className="services services--enhanced"
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
      </div>
    </section>
  );
}

export default ProblemSection;