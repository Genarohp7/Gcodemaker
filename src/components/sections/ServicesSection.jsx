import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20p%C3%A1gina%20web%20para%20mi%20negocio";

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
      id: "restaurantes",
      label: "Restaurantes",
      title: "Páginas web para restaurantes que quieren verse mejor y vender más",
      description:
        "Tu página puede ayudarte a mostrar menú, promociones, horarios, ubicación y contacto sin que el cliente tenga que andar adivinando.",
      includes: [
        "Menú digital fácil de consultar",
        "Ubicación, horarios y contacto más claros",
        "Imagen más profesional para atraer más clientes",
      ],
    },
    {
      id: "salud",
      label: "Sector salud",
      title: "Páginas web para el sector salud que transmiten confianza",
      description:
        "En salud, la primera impresión importa mucho. Una buena página ayuda a explicar mejor tus servicios y a que el paciente sienta más seguridad antes de contactarte.",
      includes: [
        "Información profesional y fácil de entender",
        "Mayor confianza para pacientes nuevos",
        "Base lista para contacto, citas y presencia online",
      ],
    },
    {
      id: "negocios-pequenos",
      label: "Negocios pequeños",
      title: "Páginas web para negocios que quieren crecer con mejor imagen",
      description:
        "Si tu negocio va empezando, una página web te ayuda a verte más serio, comunicar mejor lo que haces y no depender solo de redes sociales.",
      includes: [
        "Presencia online clara y rápida de lanzar",
        "Mejor imagen para clientes nuevos",
        "Base digital para empezar a vender con más confianza",
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
              Soluciones pensadas según el tipo de negocio que quieres impulsar
            </h2>

            <p className="section__text section__text--intro">
              No todos los negocios necesitan la misma página. Por eso el enfoque
              cambia según tu giro, tu momento y la forma en la que necesitas
              presentarte para generar más confianza y más clientes.
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
                No vendemos páginas iguales para todos
              </span>
              <p className="services-section__panel-text">
                La idea no es solo que tu negocio tenga “una página”, sino una
                página que sí ayude a explicar mejor tu oferta y a facilitar el
                contacto.
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
                también puedo ayudarte a reorganizarla y darle una imagen mucho
                más sólida y vendible.
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