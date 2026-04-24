import { Link } from "react-router";
import { motion as Motion } from "motion/react";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_HREF =
  "https://wa.me/525522737432?text=Hola%2C%20quiero%20una%20soluci%C3%B3n%20web%20profesional%20para%20mi%20negocio%20o%20proyecto%20digital";

function createAboutPreview() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="900" y2="900" gradientUnits="userSpaceOnUse">
          <stop stop-color="#07111F"/>
          <stop offset="1" stop-color="#0E1C31"/>
        </linearGradient>
        <linearGradient id="glow" x1="120" y1="140" x2="760" y2="760" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4DA3FF" stop-opacity="0.30"/>
          <stop offset="1" stop-color="#FFCB4E" stop-opacity="0.18"/>
        </linearGradient>
      </defs>

      <rect width="900" height="900" rx="40" fill="url(#bg)"/>
      <rect x="28" y="28" width="844" height="844" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>

      <rect x="92" y="96" width="716" height="708" rx="34" fill="url(#glow)"/>

      <circle cx="450" cy="325" r="126" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.10)"/>
      <circle cx="450" cy="292" r="64" fill="rgba(255,255,255,0.14)"/>
      <path d="M322 496c24-74 92-118 128-118s104 44 128 118v66H322v-66Z" fill="rgba(255,255,255,0.14)"/>

      <rect x="160" y="620" width="180" height="54" rx="18" fill="rgba(255,255,255,0.08)"/>
      <rect x="360" y="620" width="180" height="54" rx="18" fill="rgba(77,163,255,0.18)"/>
      <rect x="560" y="620" width="180" height="54" rx="18" fill="rgba(255,203,78,0.16)"/>

      <rect x="178" y="176" width="160" height="16" rx="8" fill="rgba(255,255,255,0.16)"/>
      <rect x="562" y="176" width="160" height="16" rx="8" fill="rgba(255,255,255,0.16)"/>

      <rect x="194" y="706" width="120" height="14" rx="7" fill="rgba(255,255,255,0.14)"/>
      <rect x="390" y="706" width="120" height="14" rx="7" fill="rgba(255,255,255,0.14)"/>
      <rect x="586" y="706" width="120" height="14" rx="7" fill="rgba(255,255,255,0.14)"/>

      <text x="450" y="790" text-anchor="middle" fill="#EAF3FF" font-family="Montserrat, Arial, sans-serif" font-size="34" font-weight="700">
        Claridad. Google. Conversión.
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const aboutPreview = createAboutPreview();

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
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function AboutSection() {
  const principles = [
    {
      id: "claridad",
      title: "Primero debe entenderse, luego impresionar",
      text: "Una solución web útil no solo se ve bien. También deja claro qué hace tu negocio, a quién ayuda, por qué confiar y cómo puede contactarte una persona interesada.",
    },
    {
      id: "google",
      title: "La página debe estar preparada para Google",
      text: "Trabajo la estructura, el contenido y la base técnica para que tu sitio pueda indexarse mejor y servir como apoyo para SEO, medición y campañas digitales.",
    },
    {
      id: "mejora",
      title: "No todo tiene que empezar desde cero",
      text: "También puedo trabajar sobre una página que ya existe para mejorar su imagen, su estructura, su mensaje y la forma en la que presenta tu negocio.",
    },
  ];

  const stack = [
    "Desarrollo web",
    "Landing pages",
    "SEO inicial",
    "Indexación en Google",
    "Google Ads",
    "Mejora de sitios",
  ];

  const stats = [
    {
      id: "focus",
      value: "Más claridad",
      label: "Para que tu negocio o proyecto se entienda rápido",
    },
    {
      id: "google",
      value: "Mejor base",
      label: "Para Google, SEO inicial y campañas digitales",
    },
    {
      id: "action",
      value: "Más oportunidad",
      label: "Para convertir visitas en contactos reales",
    },
  ];

  function handleAboutWhatsappClick() {
    trackEvent("whatsapp_click", {
      click_origin: "about_whatsapp",
      section: "about",
      cta_name: "hablemos_de_mi_proyecto",
    });
  }

  function handleAboutPackagesClick() {
    trackEvent("about_cta_click", {
      cta_name: "ver_promocion_y_paquetes",
      cta_location: "about",
      destination: "/promociones-paquetes",
    });
  }

  return (
    <section id="sobre-mi" className="section">
      <div className="section__container">
        <Motion.div
          className="about-section about-section--enhanced"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
          variants={containerVariants}
        >
          <Motion.div className="about-section__media" variants={itemVariants}>
            <div className="about-section__visual">
              <img
                src={aboutPreview}
                alt="Vista conceptual de una solución web profesional preparada para Google"
                className="about-section__image"
                loading="lazy"
              />
            </div>

            <div className="about-section__stats">
              {stats.map((item) => (
                <Motion.article
                  key={item.id}
                  className="about-section__stat"
                  whileHover={{ y: -2 }}
                >
                  <span className="about-section__stat-value">{item.value}</span>
                  <span className="about-section__stat-label">{item.label}</span>
                </Motion.article>
              ))}
            </div>
          </Motion.div>

          <Motion.div className="about-section__content" variants={itemVariants}>
            <p className="section__eyebrow">Quién desarrollará tu solución</p>

            <h2 className="section__title">
              Desarrollo páginas web y soluciones digitales para negocios que
              necesitan verse mejor, aparecer en Google y convertir más
            </h2>

            <p className="section__text">
              Soy Genaro Hernández Piñeiro y trabajo en GCodemaker creando y
              mejorando sitios web para negocios, marcas y proyectos digitales
              que necesitan una presencia más profesional, clara y funcional.
            </p>

            <p className="section__text">
              Mi enfoque no es llenar una página de efectos ni vender puro adorno
              visual. Lo importante es que el sitio explique bien tu oferta,
              transmita confianza, esté preparado para Google y facilite que una
              persona interesada dé el siguiente paso.
            </p>

            <p className="section__text">
              Puedo ayudarte desde una landing page comercial hasta una solución
              web más completa, según el tamaño de tu proyecto, la etapa de tu
              negocio y lo que realmente necesitas lograr.
            </p>

            <div className="about-section__principles">
              {principles.map((item) => (
                <Motion.article
                  key={item.id}
                  className="about-section__principle"
                  whileHover={{ y: -3 }}
                >
                  <h3 className="about-section__principle-title">{item.title}</h3>
                  <p className="about-section__principle-text">{item.text}</p>
                </Motion.article>
              ))}
            </div>

            <div className="about-section__footer">
              <div className="about-section__stack">
                {stack.map((item) => (
                  <span key={item} className="about-section__stack-item">
                    {item}
                  </span>
                ))}
              </div>

              <div className="about-section__signature">
                <span className="about-section__signature-label">Enfoque</span>
                <p className="about-section__signature-text">
                  Crear una presencia digital clara, profesional y preparada para
                  ayudar a tu negocio a generar más confianza, más visibilidad y
                  más oportunidades reales.
                </p>
              </div>
            </div>

            <div className="about-section__actions">
              <Motion.a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleAboutWhatsappClick}
              >
                Hablemos de tu proyecto
              </Motion.a>

              <Motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
                <Link
                  to="/promociones-paquetes"
                  viewTransition
                  className="button button--secondary"
                  onClick={handleAboutPackagesClick}
                >
                  Ver promoción y paquetes
                </Link>
              </Motion.div>
            </div>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
}

export default AboutSection;