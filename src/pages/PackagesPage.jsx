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
  return `https://wa.me/525522737432?text=${encodeURIComponent(message)}`;
}

function PackagesPage() {
  const promo = {
    id: "presencia-digital-arranque",
    title: "Presencia Digital de Arranque",
    price: "Desde $2,500 MXN",
    subtitle:
      "Para empezar rápido con una página clara, profesional y lista para recibir contactos",
    description:
      "Ideal si tu negocio necesita dejar de verse improvisado y tener una página que explique qué haces, genere confianza y facilite que te escriban por WhatsApp.",
    includes: [
      "Página de presentación profesional",
      "Información principal de tu negocio, servicio o proyecto",
      "Botón directo a WhatsApp",
      "Diseño adaptable a celular",
      "Estructura inicial para Google",
      "Base clara para empezar a vender mejor en internet",
    ],
  };

  const packages = [
    {
      id: "presencia-profesional",
      name: "Presencia Profesional",
      price: "Desde $4,900 MXN",
      audience:
        "Para negocios, marcas personales o profesionistas que necesitan una presentación más completa y confiable.",
      benefit:
        "Te ayuda a ordenar tu información, explicar tus servicios con claridad y dar una imagen más formal cuando alguien busca tu negocio.",
      includes: [
        "Sitio web profesional con varias secciones",
        "Presentación clara del negocio, marca o proyecto",
        "Sección de servicios o propuesta principal",
        "Información de contacto visible",
        "Botones para facilitar el contacto",
        "Diseño adaptable a celular",
        "SEO inicial en estructura y contenido básico",
        "Base preparada para indexación en Google",
      ],
    },
    {
      id: "impulso-comercial",
      name: "Impulso Comercial",
      price: "Desde $8,900 MXN",
      audience:
        "Para negocios que quieren verse más confiables, captar más contactos y estar mejor preparados para campañas.",
      benefit:
        "Es la opción más recomendada si quieres una página con más intención comercial, mejor estructura, medición y un recorrido más claro hacia WhatsApp o formulario.",
      includes: [
        "Todo lo del paquete anterior",
        "Estructura más comercial para guiar al cliente",
        "Más secciones para explicar mejor tu oferta",
        "Bloques para generar confianza y resolver dudas",
        "Enfoque claro en captación de contactos",
        "Formulario sencillo de contacto",
        "Botones estratégicos hacia WhatsApp",
        "Optimización más completa para SEO inicial",
        "Base preparada para campañas de Google Ads",
        "Medición conectada con Google Analytics",
      ],
      highlighted: true,
      badge: "La opción más recomendada",
    },
    {
      id: "sistema-de-crecimiento",
      name: "Sistema de Crecimiento",
      price: "Desde $24,900 MXN",
      audience:
        "Para negocios o proyectos que necesitan funciones personalizadas, procesos digitales o una solución más robusta.",
      benefit:
        "Convierte tu sitio en una herramienta de trabajo más completa: útil para captar información, ordenar procesos, administrar contenido o preparar crecimiento futuro.",
      includes: [
        "Todo lo del paquete anterior",
        "Funciones personalizadas según tu proyecto",
        "Agenda de citas, reservas o solicitudes",
        "Panel para administrar información",
        "Formularios más completos",
        "Herramientas para ordenar procesos y atención",
        "Estructura preparada para crecimiento futuro",
        "Base técnica más robusta según el alcance del proyecto",
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
      cta_name: "cotizar_por_whatsapp",
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
      cta_name: "cotizar_promocion_2500",
      cta_location: "packages_promo",
      click_origin: "packages_promo_whatsapp",
      offer_type: "promo",
      offer_name: promo.title,
    });
  }

  function handlePackageClick(pkg) {
    trackWhatsappCta({
      cta_name: "cotizar_este_paquete",
      cta_location: "packages_grid",
      click_origin: `package_${pkg.id}_whatsapp`,
      offer_type: "package",
      package_id: pkg.id,
      package_name: pkg.name,
    });
  }

  function handleAdviceClick() {
    trackWhatsappCta({
      cta_name: "saber_que_paquete_me_conviene",
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
                Páginas web para negocios que quieren verse más profesionales
              </span>

              <h1 className="packages-page__hero-title">
                Elige una página web que ayude a tu negocio a generar confianza
                y recibir más contactos
              </h1>

              <p className="packages-page__hero-text">
                Si tu negocio se ve improvisado en internet, muchos clientes se
                van antes de escribirte. Aquí puedes empezar con una promoción
                clara o elegir un paquete más completo según lo que necesitas
                vender, explicar o captar.
              </p>

              <div className="packages-page__hero-actions">
                <Motion.a
                  href={buildWhatsAppHref(
                    "Hola, quiero cotizar una página web para mi negocio. Vi la promoción desde $2,500 MXN."
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleHeroWhatsappClick}
                >
                  Cotizar por WhatsApp
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
                  Promoción de entrada
                </span>

                <h2 className="packages-page__offer-title">{promo.title}</h2>

                <p className="packages-page__offer-price">{promo.price}</p>

                <p className="packages-page__offer-text">
                  Para negocios que necesitan una página profesional sin
                  complicarse: clara, adaptable a celular y con contacto directo
                  por WhatsApp.
                </p>

                <ul className="packages-page__offer-list">
                  <li className="packages-page__offer-item">
                    Deja de verte improvisado
                  </li>
                  <li className="packages-page__offer-item">
                    Presenta mejor tu negocio
                  </li>
                  <li className="packages-page__offer-item">
                    Facilita que te contacten
                  </li>
                </ul>

                <Motion.a
                  href={buildWhatsAppHref(
                    "Hola, quiero cotizar la promoción desde $2,500 MXN para una página web de mi negocio."
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handlePromoClick}
                >
                  Cotizar esta promoción
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

              <p className="section__text">{promo.description}</p>

              <div className="packages-page__promo-note">
                <span className="packages-page__promo-note-label">
                  Ideal para
                </span>
                <p className="packages-page__promo-note-text">
                  Negocios, marcas personales o proyectos que quieren verse más
                  serios, explicar mejor lo que ofrecen y empezar a recibir
                  contactos desde una página sencilla pero bien presentada.
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
                <h3 className="packages-page__list-title">
                  Antes de cotizar
                </h3>
                <p className="section__text">
                  Revisamos tu caso para confirmar alcance, contenido necesario
                  y cualquier herramienta externa que pudiera requerirse. Así
                  cotizamos claro desde el inicio, sin letras chiquitas ni
                  sorpresas.
                </p>
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
              Este es el lugar correcto si tu negocio necesita verse
              profesional, generar confianza y recibir contactos
            </Motion.h2>

            <Motion.p
              className="section__text section__text--intro"
              variants={itemVariants}
            >
              Elige según el momento de tu negocio: empezar rápido, presentar
              mejor tus servicios, captar más contactos o construir una solución
              web más robusta.
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
                </div>

                <p className="packages-page__card-footnote">
                  El precio final se confirma según el alcance real del proyecto.
                  Si se requieren funciones especiales, campañas activas o
                  herramientas externas, se cotizan aparte antes de iniciar.
                </p>

                <div className="packages-page__card-actions">
                  <Motion.a
                    href={buildWhatsAppHref(
                      `Hola, quiero cotizar el paquete ${pkg.name} para mi negocio.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handlePackageClick(pkg)}
                  >
                    Cotizar este paquete
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
                Si no tienes claro si te conviene empezar con la promoción,
                mejorar una página existente o avanzar hacia una solución más
                completa, lo revisamos juntos y definimos la ruta más sensata
                para tu objetivo y presupuesto.
              </p>
            </div>

            <div className="final-cta__actions">
              <Motion.a
                href={buildWhatsAppHref(
                  "Hola, quiero saber qué paquete me conviene para mi negocio o proyecto."
                )}
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleAdviceClick}
              >
                Saber qué paquete me conviene
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