import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20p%C3%A1gina%20web%20o%20soluci%C3%B3n%20digital%20para%20mi%20negocio";

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

function ServicesSection() {
  const services = [
    {
      id: "sitios-web-profesionales",
      label: "Presencia digital",
      title: "Páginas web profesionales para presentar mejor tu negocio",
      description:
        "Creamos sitios web claros, modernos y fáciles de navegar para que tu negocio se vea más confiable, explique mejor lo que ofrece y facilite el primer contacto.",
      includes: [
        "Diseño profesional alineado a tu marca",
        "Información clara para tus clientes",
        "Contacto directo por WhatsApp, formulario o enlaces clave",
      ],
    },
    {
      id: "seo-google",
      label: "Google y SEO",
      title: "Base técnica para aparecer mejor preparado en Google",
      description:
        "Una página no solo debe verse bien. También necesita una estructura correcta para que Google pueda entenderla, indexarla y usarla como base para SEO o campañas.",
      includes: [
        "Estructura inicial pensada para SEO",
        "Configuración para indexación en Google",
        "Sitio preparado para campañas y medición",
      ],
    },
    {
      id: "soluciones-digitales",
      label: "Soluciones digitales",
      title: "Desarrollo web adaptado al tamaño y etapa de tu proyecto",
      description:
        "No todos los negocios necesitan lo mismo. Podemos ayudarte desde una landing page comercial hasta una solución web más completa si tu proyecto requiere crecer.",
      includes: [
        "Landing pages para captar clientes",
        "Sitios informativos para negocios y marcas",
        "Bases para proyectos más avanzados o escalables",
      ],
    },
  ];

  function handleServicesWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "services_whatsapp",
      section: "services",
      cta_name: "resolver_mi_proyecto_por_whatsapp",
    });
  }

  function handleServicesPackagesClick() {
    trackEvent("services_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "services",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section id="servicios" className="section section--alt">
      <div className="section__container">
        <Motion.div
          className="services-section__header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Motion.div className="services-section__copy" variants={itemVariants}>
            <p className="section__eyebrow">Servicios</p>

            <h2 className="section__title">
              Desarrollo web para negocios que necesitan verse mejor, aparecer
              en Google y convertir más
            </h2>

            <p className="section__text section__text--intro">
              No trabajamos con una página genérica para todos. Creamos
              soluciones digitales según el momento de tu negocio, tu objetivo
              comercial y la forma en la que tus clientes necesitan encontrarte,
              entenderte y contactarte.
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
                Para negocios de distintos giros y tamaños
              </span>
              <p className="services-section__panel-text">
                Podemos ayudarte si estás iniciando, si quieres profesionalizar
                tu presencia digital o si necesitas una base más seria para
                vender, anunciarte o crecer.
              </p>
            </Motion.div>

            <Motion.div
              className="services-section__panel-box"
              variants={itemVariants}
              whileHover={{ y: -3 }}
            >
              <span className="services-section__panel-label">
                También mejoramos sitios existentes
              </span>
              <p className="services-section__panel-text">
                Si tu página actual se ve vieja, confusa o poco profesional,
                también puedo ayudarte a reorganizarla, mejorar su mensaje y
                darle una imagen mucho más sólida y vendible.
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
          {services.map((service) => (
            <Motion.article
              key={service.id}
              className="services__card services__card--enhanced"
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <div className="services__top">
                <p className="services__label">{service.label}</p>

                <div className="services__icon" aria-hidden="true">
                  <span className="services__icon-dot"></span>
                  <span className="services__icon-line"></span>
                </div>
              </div>

              <h3 className="services__title">{service.title}</h3>
              <p className="services__text">{service.description}</p>

              <ul className="services__list">
                {service.includes.map((item) => (
                  <li key={item} className="services__item">
                    {item}
                  </li>
                ))}
              </ul>
            </Motion.article>
          ))}
        </Motion.div>

        <Motion.div
          className="services-section__actions"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Motion.a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="button button--primary"
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleServicesWhatsappClick}
          >
            Resolver mi proyecto por WhatsApp
          </Motion.a>

          <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
            <Link
              to="/promociones-paquetes"
              viewTransition
              className="button button--secondary services-section__cta"
              onClick={handleServicesPackagesClick}
            >
              Ver promoción y paquetes
            </Link>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
}

export default ServicesSection;