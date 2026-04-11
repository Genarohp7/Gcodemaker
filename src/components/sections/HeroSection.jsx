import { Link } from "react-router";
import { motion as Motion } from "motion/react";

function createHeroPreview() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="900" gradientUnits="userSpaceOnUse">
          <stop stop-color="#07111F"/>
          <stop offset="1" stop-color="#0B1728"/>
        </linearGradient>
        <linearGradient id="glow" x1="160" y1="120" x2="1040" y2="780" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4DA3FF" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#FFCB4E" stop-opacity="0.18"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="900" rx="40" fill="url(#bg)"/>
      <rect x="28" y="28" width="1144" height="844" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>

      <circle cx="94" cy="84" r="10" fill="#FF5F57"/>
      <circle cx="126" cy="84" r="10" fill="#FEBC2E"/>
      <circle cx="158" cy="84" r="10" fill="#28C840"/>

      <rect x="214" y="62" width="430" height="42" rx="21" fill="rgba(255,255,255,0.06)"/>
      <rect x="950" y="62" width="140" height="42" rx="21" fill="rgba(255,255,255,0.06)"/>

      <rect x="70" y="150" width="1060" height="680" rx="30" fill="url(#glow)"/>

      <rect x="112" y="194" width="294" height="592" rx="26" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
      <rect x="442" y="194" width="620" height="258" rx="26" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
      <rect x="442" y="486" width="620" height="300" rx="26" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>

      <rect x="150" y="236" width="120" height="16" rx="8" fill="rgba(255,255,255,0.18)"/>
      <rect x="150" y="270" width="180" height="16" rx="8" fill="rgba(255,255,255,0.10)"/>
      <rect x="150" y="304" width="144" height="16" rx="8" fill="rgba(255,255,255,0.10)"/>

      <rect x="150" y="368" width="220" height="112" rx="20" fill="rgba(77,163,255,0.14)"/>
      <rect x="150" y="510" width="220" height="112" rx="20" fill="rgba(255,203,78,0.12)"/>
      <rect x="150" y="652" width="220" height="96" rx="20" fill="rgba(255,255,255,0.06)"/>

      <rect x="480" y="232" width="170" height="18" rx="9" fill="rgba(255,255,255,0.18)"/>
      <rect x="480" y="268" width="260" height="16" rx="8" fill="rgba(255,255,255,0.10)"/>
      <rect x="480" y="300" width="230" height="16" rx="8" fill="rgba(255,255,255,0.10)"/>
      <rect x="480" y="352" width="540" height="56" rx="18" fill="rgba(255,255,255,0.08)"/>

      <rect x="480" y="526" width="250" height="176" rx="22" fill="rgba(255,255,255,0.07)"/>
      <rect x="758" y="526" width="264" height="80" rx="18" fill="rgba(77,163,255,0.14)"/>
      <rect x="758" y="624" width="264" height="80" rx="18" fill="rgba(255,203,78,0.12)"/>

      <text x="112" y="836" fill="#EAF3FF" font-family="Montserrat, Arial, sans-serif" font-size="50" font-weight="700">
        Más clientes. Mejor presencia.
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const heroPreview = createHeroPreview();

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

function HeroSection() {
  const tags = [
    "Restaurantes",
    "Clínicas y consultorios",
    "Dentistas",
    "Negocios pequeños",
    "Páginas para vender más",
  ];

  const metrics = [
    {
      id: "claridad",
      value: "Más claridad",
      label:
        "Para que tus clientes entiendan rápido qué ofreces y cómo contactarte.",
    },
    {
      id: "presencia",
      value: "Más confianza",
      label:
        "Para que tu negocio se vea profesional y no dependa solo de redes sociales.",
    },
    {
      id: "resultado",
      value: "Más oportunidades",
      label:
        "Una página bien hecha ayuda a atraer clientes y a convertir mejor las visitas.",
    },
  ];

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
            Páginas web para negocios que quieren crecer
          </Motion.p>

          <Motion.h1 className="hero__title" variants={itemVariants}>
            Páginas web para negocios que quieren más clientes
          </Motion.h1>

          <Motion.p className="hero__description" variants={itemVariants}>
            Si tu negocio no tiene página web, se ve poco profesional o depende
            solo de redes sociales, estás dejando pasar oportunidades. En
            GCodemaker creamos páginas pensadas para ayudarte a mostrar mejor tu
            negocio y convertir visitas en contactos reales.
          </Motion.p>

          <Motion.p
            className="hero__description hero__description--secondary"
            variants={itemVariants}
          >
            También puedes revisar una promoción de entrada y paquetes pensados
            para distintos momentos de tu negocio, desde una opción para empezar
            rápido hasta soluciones más completas.
          </Motion.p>

          <Motion.div className="hero__actions" variants={itemVariants}>
            <Motion.a
              href="#contacto"
              className="button button--primary"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
            >
              Solicita tu página
            </Motion.a>

            <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
              <Link
                to="/promociones-paquetes"
                className="button button--secondary"
              >
                Ver promociones y paquetes
              </Link>
            </Motion.div>

            <Motion.a
              href="#proyectos"
              className="button button--secondary"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
            >
              Ver ejemplos
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
              Lo que debe lograr una buena página
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
              <Motion.img
                src={heroPreview}
                alt="Vista conceptual de una página web profesional para negocios"
                className="hero__preview-image"
                loading="eager"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
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