import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_MESSAGE =
  "Hola, quiero cotizar una página web para mi negocio. Vi la promoción desde $2,500 MXN.";

const WHATSAPP_HREF = `https://wa.me/525522737432?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const panelVariants = {
  hidden: { opacity: 0, x: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.18,
    },
  },
};

const HeroScene = lazy(() => import("./HeroScene"));

function HeroSceneFallback() {
  return (
    <div className="hero__preview-fallback" aria-hidden="true">
      <span className="hero__preview-fallback-glow hero__preview-fallback-glow--1" />
      <span className="hero__preview-fallback-glow hero__preview-fallback-glow--2" />
      <span className="hero__preview-fallback-ring hero__preview-fallback-ring--outer" />
      <span className="hero__preview-fallback-ring hero__preview-fallback-ring--inner" />
      <span className="hero__preview-fallback-core" />
    </div>
  );
}

function HeroSection() {
  const tags = [
    "Página clara y profesional",
    "WhatsApp visible",
    "Base para Google",
    "Desde $2,500 MXN",
  ];

  const metrics = [
    {
      id: "promo",
      value: "Desde $2,500 MXN",
      label:
        "Una opción de arranque para dejar de verte improvisado y empezar con una página profesional.",
    },
    {
      id: "trust",
      value: "Más confianza",
      label:
        "Tu cliente entiende mejor qué ofreces, por qué elegirte y cómo contactarte.",
    },
    {
      id: "contact",
      value: "Más mensajes",
      label:
        "La experiencia guía al visitante hacia WhatsApp con llamados claros y visibles.",
    },
  ];

  function trackWhatsAppClick({ ctaName, clickOrigin }) {
    trackEvent("hero_cta_click", {
      cta_name: ctaName,
      cta_location: "hero",
      destination: "whatsapp",
    });

    trackEvent("whatsapp_click", {
      click_origin: clickOrigin,
      section: "hero",
      cta_name: ctaName,
    });
  }

  function handlePrimaryWhatsappClick() {
    trackWhatsAppClick({
      ctaName: "cotizar_mi_pagina_por_whatsapp",
      clickOrigin: "hero_primary_whatsapp",
    });
  }

  function handlePromoDetailsClick() {
    trackEvent("hero_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "hero",
      destination: "/promociones-paquetes",
      offer_focus: "promocion_2500",
    });
  }

  return (
    <section id="inicio" className="hero">
      <div className="hero__container hero__container--grid">
        <Motion.div
          className="hero__main"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Motion.p className="hero__eyebrow" variants={itemVariants}>
            Páginas web para negocios que necesitan verse profesionales
          </Motion.p>

          <Motion.div className="hero__promo" variants={itemVariants}>
            <span className="hero__promo-badge">Promoción de arranque</span>
            <p className="hero__promo-text">
              Página web desde <strong>$2,500 MXN</strong> para presentar mejor
              tu negocio, generar confianza y facilitar que te contacten.
            </p>

            <Link
              to="/promociones-paquetes"
              viewTransition
              className="hero__promo-link"
              onClick={handlePromoDetailsClick}
            >
              Ver detalles de la promoción
            </Link>
          </Motion.div>

          <Motion.h1 className="hero__title" variants={itemVariants}>
            Tu negocio puede verse más profesional y recibir más contactos desde
            una página web clara
          </Motion.h1>

          <Motion.p className="hero__description" variants={itemVariants}>
            Creamos páginas web y soluciones digitales para negocios que quieren
            explicar mejor lo que ofrecen, verse confiables y convertir visitas
            en conversaciones reales por WhatsApp.
          </Motion.p>

          <Motion.p
            className="hero__description hero__description--secondary"
            variants={itemVariants}
          >
            Te ayudamos con el armado de la página, estructura inicial para
            Google, SEO base y una experiencia pensada para que tu cliente sepa
            qué haces y cómo contactarte.
          </Motion.p>

          <Motion.div className="hero__actions" variants={itemVariants}>
            <Motion.a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handlePrimaryWhatsappClick}
            >
              Cotizar mi página por WhatsApp
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handlePromoDetailsClick}
              >
                Ver promoción y paquetes
              </Link>
            </Motion.div>
          </Motion.div>

          <Motion.ul className="hero__tags" variants={itemVariants}>
            {tags.map((item, index) => (
              <Motion.li
                key={item}
                className="hero__tag"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.45 + index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -2 }}
              >
                {item}
              </Motion.li>
            ))}
          </Motion.ul>
        </Motion.div>

        <Motion.aside
          className="hero__panel"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="hero__panel-card">
            

            <Motion.div
              className="hero__preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.34,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Suspense fallback={<HeroSceneFallback />}>
                <HeroScene />
              </Suspense>
            </Motion.div>

            <div className="hero__metrics">
              {metrics.map((item, index) => (
                <Motion.article
                  key={item.id}
                  className="hero__metric"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.46 + index * 0.08,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                >
                  <span className="hero__metric-value">{item.value}</span>
                  <span className="hero__metric-label">{item.label}</span>
                </Motion.article>
              ))}
            </div>
          </div>
        </Motion.aside>
      </div>
    </section>
  );
}

export default HeroSection;