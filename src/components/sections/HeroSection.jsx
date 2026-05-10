import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_MESSAGE =
  "Hola, quiero cotizar una página web con posibilidad de integrar un asistente IA para mi negocio.";

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
    "Asistente IA opcional",
    "WhatsApp visible",
    "Base para Google",
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
      ctaName: "recibir_cotizacion_por_whatsapp",
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
            Páginas web con asistentes IA integrados para negocios
          </Motion.p>

          <Motion.div className="hero__promo" variants={itemVariants}>
            <span className="hero__promo-badge">Nuevo servicio IA</span>
            <p className="hero__promo-text">
              Integramos asistentes IA a tu página web para responder dudas,
              captar prospectos y guiar clientes hacia WhatsApp. No es hacer tu
              página con IA: es poner IA al servicio de tu negocio.
            </p>

            <a href="#demo-ia" className="hero__promo-link">
              Quiero probar la IA
            </a>
          </Motion.div>

          <Motion.h1 className="hero__title" variants={itemVariants}>
            Tu negocio puede tener una página profesional y un asistente IA que
            atienda clientes desde tu web
          </Motion.h1>

          <Motion.p className="hero__description" variants={itemVariants}>
            Creamos páginas web para negocios que necesitan verse profesionales,
            explicar mejor lo que ofrecen y convertir visitas en contactos. Si
            tu proyecto lo requiere, también podemos integrar un asistente IA
            conectado a tus objetivos comerciales.
          </Motion.p>

          <Motion.p
            className="hero__description hero__description--secondary"
            variants={itemVariants}
          >
            La IA no reemplaza tu sitio: lo vuelve más útil. Puede responder
            preguntas frecuentes, orientar al visitante, capturar datos y ayudarte
            a atender mejor sin depender solo de mensajes manuales.
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
              Cotizar web con IA integrada
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                viewTransition
                className="button button--secondary"
                onClick={handlePromoDetailsClick}
              >
                Ver promoción web
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
            <Motion.p
              className="hero__panel-label"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55 }}
            >
              Servicio disponible
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
