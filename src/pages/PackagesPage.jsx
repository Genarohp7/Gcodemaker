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

function buildWhatsAppHref(message) {
  return `https://wa.me/525567359470?text=${encodeURIComponent(message)}`;
}

function PackagesPage() {
  const promo = {
    id: "pagina-arranque",
    title: "Página de Arranque",
    price: "Desde $2,500 MXN",
    subtitle: "La forma más rápida de empezar con una presencia digital más seria",
    description:
      "Pensada para negocios que necesitan dejar de verse improvisados y empezar a presentarse mejor en internet sin hacer una inversión grande al inicio.",
    includes: [
      "Una página de presentación clara y profesional",
      "Información principal del negocio",
      "Botón directo de contacto",
      "Diseño adaptable a celular",
      "Base ideal para empezar a moverte mejor en internet",
    ],
    excludes: [
      "Funciones especiales o sistemas personalizados",
      "Secciones avanzadas o flujos complejos",
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
      audience: "Para negocios que ya quieren verse formales y dar más confianza",
      benefit:
        "Te ayuda a presentar mejor tu negocio, explicar tus servicios con claridad y dar una imagen mucho más profesional.",
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
      audience: "Para negocios que quieren una página pensada para conseguir clientes",
      benefit:
        "Es la opción más equilibrada si quieres una página con mejor estructura comercial, más confianza y mejores oportunidades de contacto.",
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
      badge: "La opción más recomendada",
    },
    {
      id: "sistema-de-crecimiento",
      name: "Sistema de Crecimiento",
      price: "Desde $24,900 MXN",
      audience: "Para negocios que necesitan una solución más completa y personalizada",
      benefit:
        "Convierte tu página en una herramienta de trabajo real para organizar mejor la atención, ahorrar tiempo y crecer con una solución más robusta.",
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

  function trackWhatsappCta(params) {
    trackPackagesCta({
      ...params,
      destination: "whatsapp",
    });

    const whatsappPayload = {
      click_origin: params.click_origin,
      section: "packages_page",
      cta_name: params.cta_name,
    };

    if (params.offer_type) {
      whatsappPayload.offer_type = params.offer_type;
    }

    if (params.offer_name) {
      whatsappPayload.offer_name = params.offer_name;
    }

    if (params.package_id) {
      whatsappPayload.package_id = params.package_id;
    }

    if (params.package_name) {
      whatsappPayload.package_name = params.package_name;
    }

    trackEvent("whatsapp_click", whatsappPayload);
  }

  function handleHeroWhatsappClick() {
    trackWhatsappCta({
      cta_name: "quiero_informacion_por_whatsapp",
      cta_location: "packages_hero",
      click_origin: "packages_hero_whatsapp",
    });
  }

  function handleComparePackagesClick() {
    trackPackagesCta({
      cta_name: "comparar_paquetes",
      cta_location: "packages_hero",
      destination: "#packages-grid",
    });
  }

  function handlePromoClick() {
    trackWhatsappCta({
      cta_name: "quiero_esta_promocion",
      cta_location: "packages_promo",
      click_origin: "packages_promo_whatsapp",
      offer_type: "promo",
      offer_name: promo.title,
    });
  }

  function handlePackageClick(pkg) {
    trackWhatsappCta({
      cta_name: "solicitar_este_paquete",
      cta_location: "packages_grid",
      click_origin: `package_${pkg.id}_whatsapp`,
      offer_type: "package",
      package_id: pkg.id,
      package_name: pkg.name,
    });
  }

  function handleAdviceClick() {
    trackWhatsappCta({
      cta_name: "quiero_asesoria",
      cta_location: "packages_final_cta",
      click_origin: "packages_final_whatsapp",
    });
  }

  function handleExamplesClick() {
    trackPackagesCta({
      cta_name: "ver_ejemplos_reales",
      cta_location: "packages_final_cta",
      destination: "/#proyectos",
    });
  }

  return (
    <>
      <section className="section packages-page__hero">
        <div className="section__container">
          <Motion.div
            className="packages-page__hero-grid"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Motion.div className="packages-page__hero-copy" variants={itemVariants}>
              <p className="section__eyebrow">Promociones y paquetes</p>

              <span className="packages-page__hero-badge">
                Promoción de arranque visible desde el inicio
              </span>

              <h1 className="packages-page__hero-title">
                Elige la mejor forma de llevar tu negocio a internet sin adivinar
                cuánto necesitas
              </h1>

              <p className="packages-page__hero-text">
                Aquí no vas a encontrar paquetes inflados ni explicaciones raras.
                Vas a encontrar una promoción clara para empezar rápido y opciones
                más completas para negocios que quieren verse mejor, dar más
                confianza y conseguir más clientes.
              </p>

              <div className="packages-page__hero-actions">
                <Motion.a
                  href={buildWhatsAppHref(
                    "Hola, quiero información sobre una página web para mi negocio"
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleHeroWhatsappClick}
                >
                  Quiero información por WhatsApp
                </Motion.a>

                <Motion.a
                  href="#packages-grid"
                  className="button button--secondary"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleComparePackagesClick}
                >
                  Comparar paquetes
                </Motion.a>
              </div>
            </Motion.div>

            <Motion.aside className="packages-page__hero-panel" variants={cardVariants}>
              <div className="packages-page__offer-card">
                <span className="packages-page__offer-label">
                  Oferta de entrada
                </span>

                <h2 className="packages-page__offer-title">
                  {promo.title}
                </h2>

                <p className="packages-page__offer-price">{promo.price}</p>

                <p className="packages-page__offer-text">
                  Ideal si necesitas salir rápido con una imagen más profesional y
                  una base clara para empezar a mostrar tu negocio mejor.
                </p>

                <ul className="packages-page__offer-list">
                  <li className="packages-page__offer-item">
                    Presencia profesional de arranque
                  </li>
                  <li className="packages-page__offer-item">
                    Contacto directo y claro
                  </li>
                  <li className="packages-page__offer-item">
                    Base ideal para después crecer
                  </li>
                </ul>

                <Motion.a
                  href={buildWhatsAppHref(
                    "Hola, quiero la promoción de Página de Arranque desde $2,500 MXN"
                  )}
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
            </Motion.aside>
          </Motion.div>
        </div>
      </section>

      <section className="section section--alt packages-page__promo-section">
        <div className="section__container">
          <Motion.div
            className="packages-page__promo-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <Motion.div className="packages-page__promo-copy" variants={itemVariants}>
              <p className="section__eyebrow">Promoción de entrada</p>

              <h2 className="section__title">
                {promo.title} — {promo.price}
              </h2>

              <p className="section__text section__text--intro">
                {promo.subtitle}
              </p>

              <p className="section__text">
                {promo.description}
              </p>

              <div className="packages-page__promo-note">
                <span className="packages-page__promo-note-label">
                  Ideal para
                </span>
                <p className="packages-page__promo-note-text">
                  Negocios que quieren dejar de verse improvisados y empezar a
                  presentarse mejor sin saltar directo a una inversión más grande.
                </p>
              </div>
            </Motion.div>

            <Motion.div className="packages-page__promo-lists" variants={containerVariants}>
              <Motion.article
                className="packages-page__list-card"
                variants={itemVariants}
                whileHover={{ y: -3 }}
              >
                <h3 className="packages-page__list-title">Incluye</h3>
                <ul className="services__list">
                  {promo.includes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.article>

              <Motion.article
                className="packages-page__list-card"
                variants={itemVariants}
                whileHover={{ y: -3 }}
              >
                <h3 className="packages-page__list-title">No incluye</h3>
                <ul className="services__list">
                  {promo.excludes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.article>
            </Motion.div>
          </Motion.div>
        </div>
      </section>

      <section id="packages-grid" className="section packages-page__packages-section">
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
              La idea no es venderte lo más caro por venderlo. La idea es que
              tengas una opción clara según el punto en el que está tu negocio
              hoy y lo que realmente necesitas resolver.
            </Motion.p>
          </Motion.div>

          <Motion.div
            className="packages-page__grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={containerVariants}
          >
            {packages.map((pkg) => (
              <Motion.article
                key={pkg.id}
                className={`packages-page__card ${
                  pkg.highlighted ? "packages-page__card--featured" : ""
                }`}
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                {pkg.badge ? (
                  <span className="packages-page__card-badge">{pkg.badge}</span>
                ) : null}

                <div className="packages-page__card-head">
                  <p className="packages-page__card-label">{pkg.name}</p>
                  <h3 className="packages-page__card-price">{pkg.price}</h3>
                </div>

                <p className="packages-page__card-audience">
                  <strong>Para quién es:</strong> {pkg.audience}
                </p>

                <p className="packages-page__card-benefit">
                  <strong>Beneficio principal:</strong> {pkg.benefit}
                </p>

                <div className="packages-page__card-columns">
                  <div className="packages-page__card-column">
                    <h4 className="packages-page__card-column-title">Incluye</h4>
                    <ul className="services__list">
                      {pkg.includes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="packages-page__card-column">
                    <h4 className="packages-page__card-column-title">
                      No incluye
                    </h4>
                    <ul className="services__list">
                      {pkg.excludes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="packages-page__card-footnote">
                  El precio final puede variar según el alcance real del proyecto
                  y los servicios externos que se necesiten.
                </p>

                <div className="packages-page__card-actions">
                  <Motion.a
                    href={buildWhatsAppHref(
                      `Hola, quiero información sobre el paquete ${pkg.name}`
                    )}
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
        className="final-cta packages-page__final-cta"
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
                Te ayudo a elegir la opción más conveniente para tu negocio
              </h2>
              <p className="final-cta__text">
                Si todavía no tienes claro si te conviene empezar con la promoción
                o irte a un paquete más completo, lo revisamos juntos y te digo
                qué tiene más sentido según tu negocio, tu momento y tu objetivo.
              </p>
            </div>

            <div className="final-cta__actions">
              <Motion.a
                href={buildWhatsAppHref(
                  "Hola, quiero ayuda para elegir la mejor opción para mi negocio"
                )}
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
                  to="/#proyectos"
                  viewTransition
                  className="button button--secondary"
                  onClick={handleExamplesClick}
                >
                  Ver ejemplos reales
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