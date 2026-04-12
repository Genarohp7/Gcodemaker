import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../lib/analytics";

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

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function PackagesPage() {
  const promo = {
    title: "Página de Arranque",
    price: "$2,500 MXN",
    subtitle: "Una promoción pensada para empezar rápido",
    description:
      "Ideal para negocios que necesitan salir a internet con una imagen clara y profesional sin hacer una inversión grande al inicio.",
    includes: [
      "Una página de presentación",
      "Información principal del negocio",
      "Botón de contacto directo",
      "Diseño adaptable a celular",
      "Imagen profesional para empezar a mostrarse mejor",
    ],
    excludes: [
      "Funciones especiales o sistemas personalizados",
      "Varias páginas o secciones avanzadas",
      "Procesos internos como citas, reservas o administración",
      "Cambios ilimitados",
      "Costos de dominio, hospedaje o herramientas externas que cobren por uso",
    ],
  };

  const packages = [
    {
      id: "presencia-profesional",
      name: "Presencia Profesional",
      price: "Desde $4,900 MXN",
      audience: "Para negocios que quieren una página completa y profesional",
      benefit:
        "Ayuda a que tu negocio se vea formal, genere más confianza y tenga una presencia digital sólida.",
      includes: [
        "Sitio web profesional con varias secciones",
        "Presentación clara del negocio",
        "Sección de servicios",
        "Información de contacto visible",
        "Botones para facilitar el contacto",
        "Diseño adaptable a celular",
        "Optimización básica para ayudarte a aparecer mejor en Google",
      ],
      excludes: [
        "Funciones especiales hechas a la medida",
        "Sistemas para citas, reservas o administración",
        "Integraciones avanzadas",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
      ],
    },
    {
      id: "impulso-comercial",
      name: "Impulso Comercial",
      price: "Desde $8,900 MXN",
      audience:
        "Para negocios que quieren una página enfocada en conseguir clientes",
      benefit:
        "Ayuda a que tu página no solo se vea bien, sino que también trabaje mejor para atraer y convertir clientes.",
      includes: [
        "Todo lo del paquete anterior",
        "Mejor estructura para guiar al cliente",
        "Más secciones para explicar mejor el negocio",
        "Espacios para generar más confianza",
        "Presentación más completa y comercial",
        "Enfoque más claro en captar contactos",
        "Formularios sencillos para facilitar el contacto",
        "Optimización más completa para ayudarte a aparecer mejor en Google",
        "Medición conectada con Google Analytics para revisar visitas y acciones importantes",
      ],
      excludes: [
        "Sistemas personalizados complejos",
        "Procesos internos avanzados",
        "Funciones especiales fuera del alcance del paquete",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
      ],
      highlighted: true,
    },
    {
      id: "sistema-de-crecimiento",
      name: "Sistema de Crecimiento",
      price: "Desde $24,900 MXN",
      audience: "Para negocios que necesitan una solución más completa",
      benefit:
        "Convierte tu página en una herramienta de trabajo real para organizar mejor la atención, ahorrar tiempo y crecer.",
      includes: [
        "Todo lo del paquete anterior",
        "Funciones personalizadas según tu negocio",
        "Agenda de citas o reservas",
        "Panel para administrar información",
        "Formularios más completos",
        "Herramientas para ordenar procesos y atención",
      ],
      excludes: [
        "Precio único para todos los casos",
        "Funciones ilimitadas sin revisión previa",
        "Alcance indefinido",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
        "Costos variables de servidor, servicios de envío de correos u otras plataformas que se cobran según el uso",
      ],
    },
  ];

  function trackPackagesCta(params) {
    trackEvent("packages_cta_click", params);
  }

  function handleTopWhatsappClick() {
    trackPackagesCta({
      cta_name: "quiero_solicitar_informacion",
      cta_location: "packages_hero",
      destination: "whatsapp",
    });
  }

  function handlePromoClick() {
    trackPackagesCta({
      cta_name: "quiero_esta_promocion",
      cta_location: "packages_promo",
      destination: "whatsapp",
      offer_type: "promo",
      offer_name: promo.title,
      offer_price: promo.price,
    });
  }

  function handlePackageClick(pkg) {
    trackPackagesCta({
      cta_name: "solicitar_este_paquete",
      cta_location: "packages_grid",
      destination: "whatsapp",
      offer_type: "package",
      package_id: pkg.id,
      package_name: pkg.name,
      package_price: pkg.price,
      package_highlighted: pkg.highlighted ? "true" : "false",
    });
  }

  function handleAdviceClick() {
    trackPackagesCta({
      cta_name: "quiero_asesoria",
      cta_location: "packages_final_cta",
      destination: "whatsapp",
    });
  }

  function handleContactClick() {
    trackPackagesCta({
      cta_name: "ir_al_contacto",
      cta_location: "packages_final_cta",
      destination: "/#contacto",
    });
  }

  return (
    <>
      <section className="hero">
        <div className="hero__container">
          <Motion.div
            className="section__container--narrow"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Motion.p className="hero__eyebrow" variants={itemVariants}>
              Promociones y paquetes
            </Motion.p>

            <Motion.h1 className="hero__title" variants={itemVariants}>
              Opciones claras para crear o mejorar la página web de tu negocio
            </Motion.h1>

            <Motion.p className="hero__description" variants={itemVariants}>
              Aquí puedes ver una promoción de entrada para empezar rápido y los
              paquetes principales para negocios que buscan una solución más
              completa, más profesional y más útil para conseguir clientes.
            </Motion.p>

            <Motion.div className="hero__actions" variants={itemVariants}>
              <Motion.a
                href="https://wa.me/525567359470"
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleTopWhatsappClick}
              >
                Quiero solicitar información
              </Motion.a>

              <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
                <Link
                  to="/"
                  viewTransition
                  className="button button--secondary"
                >
                  Volver al inicio
                </Link>
              </Motion.div>
            </Motion.div>
          </Motion.div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="section__container">
          <Motion.div
            className="services-section__header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <Motion.div
              className="services-section__copy"
              variants={itemVariants}
            >
              <p className="section__eyebrow">Promoción de entrada</p>
              <h2 className="section__title">
                {promo.title} — {promo.price}
              </h2>
              <p className="section__text section__text--intro">
                {promo.subtitle}
              </p>
              <p className="section__text">{promo.description}</p>
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
                <span className="services-section__panel-label">Ideal para</span>
                <p className="services-section__panel-text">
                  Negocios que quieren empezar con buena imagen, contacto claro y
                  una inversión más ligera.
                </p>
              </Motion.div>

              <Motion.div
                className="services-section__panel-box"
                variants={itemVariants}
                whileHover={{ y: -3 }}
              >
                <span className="services-section__panel-label">Importante</span>
                <p className="services-section__panel-text">
                  Esta promoción funciona como puerta de entrada para después
                  crecer hacia una solución más completa si tu negocio lo
                  necesita.
                </p>
              </Motion.div>
            </Motion.aside>
          </Motion.div>

          <Motion.div
            className="projects__featured projects__featured--primary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={cardVariants}
            whileHover={{ y: -4 }}
          >
            <div className="projects__featured-content">
              <p className="projects__featured-label">Promoción activa</p>
              <p className="projects__featured-status">Precio de arranque</p>
              <h3 className="projects__featured-title">{promo.title}</h3>
              <p className="projects__featured-highlight">{promo.price}</p>
              <p className="projects__featured-summary">{promo.description}</p>

              <div className="projects__actions">
                <Motion.a
                  href="https://wa.me/525567359470"
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handlePromoClick}
                >
                  Quiero esta promoción
                </Motion.a>
              </div>
            </div>

            <div className="projects__featured-side">
              <Motion.div
                className="projects__featured-box"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
              >
                <span className="projects__featured-box-label">Incluye</span>
                <ul className="services__list">
                  {promo.includes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.div>

              <Motion.div
                className="projects__featured-box"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -2 }}
              >
                <span className="projects__featured-box-label">No incluye</span>
                <ul className="services__list">
                  {promo.excludes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.div>
            </div>
          </Motion.div>
        </div>
      </section>

      <section className="section">
        <div className="section__container">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <Motion.p className="section__eyebrow" variants={itemVariants}>
              Paquetes principales
            </Motion.p>

            <Motion.h2 className="section__title" variants={itemVariants}>
              Elige la opción que mejor se adapte al momento de tu negocio
            </Motion.h2>

            <Motion.p
              className="section__text section__text--intro"
              variants={itemVariants}
            >
              Estos paquetes están pensados para que puedas empezar con una base
              profesional y, si lo necesitas, crecer hacia una solución más
              completa.
            </Motion.p>
          </Motion.div>

          <Motion.div
            className="services services--enhanced"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={containerVariants}
          >
            {packages.map((pkg) => (
              <Motion.article
                key={pkg.id}
                className={`services__card services__card--enhanced ${
                  pkg.highlighted ? "projects__featured--primary" : ""
                }`}
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                <div className="services__top">
                  <p className="services__label">{pkg.name}</p>

                  <div className="services__icon" aria-hidden="true">
                    <span className="services__icon-dot"></span>
                    <span className="services__icon-line"></span>
                  </div>
                </div>

                <h3 className="services__title">{pkg.price}</h3>
                <p className="services__text">
                  <strong>Para quién es:</strong> {pkg.audience}
                </p>
                <p className="services__text">
                  <strong>Beneficio principal:</strong> {pkg.benefit}
                </p>

                <div className="about-section__principles">
                  <Motion.article
                    className="about-section__principle"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -2 }}
                  >
                    <h4 className="about-section__principle-title">Incluye</h4>
                    <ul className="services__list">
                      {pkg.includes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Motion.article>

                  <Motion.article
                    className="about-section__principle"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -2 }}
                  >
                    <h4 className="about-section__principle-title">
                      No incluye
                    </h4>
                    <ul className="services__list">
                      {pkg.excludes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Motion.article>
                </div>

                <div className="projects__actions">
                  <Motion.a
                    href="https://wa.me/525567359470"
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handlePackageClick(pkg)}
                  >
                    Solicitar este paquete
                  </Motion.a>
                </div>
              </Motion.article>
            ))}
          </Motion.div>
        </div>
      </section>

      <section
        className="final-cta"
        aria-labelledby="packages-final-cta-title"
      >
        <div className="section__container">
          <Motion.div
            className="final-cta__box"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardVariants}
            whileHover={{ y: -3 }}
          >
            <div className="final-cta__content">
              <p className="final-cta__eyebrow">¿No sabes cuál elegir?</p>
              <h2 id="packages-final-cta-title" className="final-cta__title">
                Te ayudo a elegir la mejor opción para tu negocio
              </h2>
              <p className="final-cta__text">
                Si todavía no tienes claro cuál promoción o paquete te conviene,
                podemos revisar tu caso y definir la opción más adecuada según el
                momento de tu negocio.
              </p>
            </div>

            <div className="final-cta__actions">
              <Motion.a
                href="https://wa.me/525567359470"
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleAdviceClick}
              >
                Quiero asesoría
              </Motion.a>

              <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
                <Link
                  to="/#contacto"
                  viewTransition
                  className="button button--secondary"
                  onClick={handleContactClick}
                >
                  Ir al contacto
                </Link>
              </Motion.div>
            </div>
          </Motion.div>
        </div>
      </section>
    </>
  );
}

export default PackagesPage;