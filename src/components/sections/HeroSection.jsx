import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const HeroScene = lazy(() => import("./HeroScene"));

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
    "Desarrollo web para negocios",
    "SEO e indexación en Google",
    "Landing pages comerciales",
    "Preparado para Google Ads",
    "WhatsApp directo",
  ];

  const metrics = [
    {
      id: "promo",
      value: "Desde $2,500 MXN",
      label:
        "Una promoción de arranque para negocios que necesitan presencia digital profesional sin complicarse.",
    },
    {
      id: "google",
      value: "Base lista para Google",
      label:
        "Estructura, contenido y configuración pensados para que tu sitio pueda indexarse y trabajar mejor con SEO y campañas.",
    },
    {
      id: "conversion",
      value: "Contacto real",
      label:
        "Diseñamos la experiencia para que tus visitantes entiendan tu oferta y puedan escribirte sin dar mil vueltas.",
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
      ctaName: "quiero_mi_sitio_web_por_whatsapp",
      clickOrigin: "hero_primary_whatsapp",
    });
  }

  function handlePromoDetailsClick() {
    trackEvent("hero_cta_click", {
      cta_name: "ver_detalles_promocion_hero",
      cta_location: "hero",
      destination: "/promociones-paquetes",
      offer_focus: "promocion_2500",
    });
  }

  function handleExamplesCtaClick() {
    trackEvent("hero_cta_click", {
      cta_name: "ver_ejemplos",
      cta_location: "hero",
      destination: "#proyectos",
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
            Desarrollo web profesional para negocios y proyectos digitales
          </Motion.p>

          <Motion.div className="hero__promo" variants={itemVariants}>
            <span className="hero__promo-badge">Promoción de arranque</span>
            <p className="hero__promo-text">
              Página web desde <strong>$2,500 MXN</strong> para negocios que
              necesitan una presencia digital seria, clara y lista para empezar
              a generar confianza.
            </p>

            <Link
              to="/promociones-paquetes"
              viewTransition
              className="hero__promo-link"
              onClick={handlePromoDetailsClick}
            >
              Ver qué incluye
            </Link>
          </Motion.div>

          <Motion.h1 className="hero__title" variants={itemVariants}>
            Páginas web y soluciones digitales pensadas para que tu negocio
            venda mejor
          </Motion.h1>

          <Motion.p className="hero__description" variants={itemVariants}>
            No importa si estás iniciando, profesionalizando tu marca o
            preparando una campaña: en GCodemaker creamos sitios web que ayudan
            a explicar mejor tu oferta, generar confianza y convertir visitas en
            contactos reales.
          </Motion.p>

          <Motion.p
            className="hero__description hero__description--secondary"
            variants={itemVariants}
          >
            Te ayudamos desde el armado de la página hasta la base técnica para
            Google: estructura clara, SEO inicial, indexación y una experiencia
            preparada para campañas, WhatsApp y crecimiento digital.
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
              Quiero mi sitio web por WhatsApp
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

            <Motion.a
              href="#proyectos"
              className="button button--secondary"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleExamplesCtaClick}
            >
              Ver ejemplos reales
            </Motion.a>
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
            <Motion.p
              className="hero__panel-label"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55 }}
            >
              Lo que debe sentir tu cliente al entrar
            </Motion.p>

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