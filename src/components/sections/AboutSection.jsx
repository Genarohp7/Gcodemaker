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
        Claridad. Confianza. Resultado.
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const aboutPreview = createAboutPreview();

function AboutSection() {
  const principles = [
    {
      id: "claridad",
      title: "Primero se entiende, luego se ve bonito",
      text: "Una página útil debe dejar claro qué hace tu negocio, a quién ayuda y cómo puede contactarte una persona interesada.",
    },
    {
      id: "confianza",
      title: "La imagen también vende",
      text: "Cuando un sitio se ve cuidado, ordenado y profesional, transmite más confianza y hace que el negocio se tome más en serio.",
    },
    {
      id: "mejora",
      title: "No todo tiene que empezar desde cero",
      text: "También puedo trabajar sobre una página que ya existe para mejorar su imagen, su estructura y la forma en la que presenta tu negocio.",
    },
  ];

  const stack = [
    "Páginas para negocios",
    "Landing pages",
    "Mejora de sitios",
    "Diseño claro",
    "Presencia profesional",
  ];

  const stats = [
    {
      id: "focus",
      value: "Más claridad",
      label: "Para que tu negocio se entienda rápido",
    },
    {
      id: "trust",
      value: "Más confianza",
      label: "Para que tu página se vea más profesional",
    },
    {
      id: "action",
      value: "Más oportunidad",
      label: "Para convertir visitas en contactos",
    },
  ];

  return (
    <section id="sobre-mi" className="section">
      <div className="section__container">
        <div className="about-section about-section--enhanced">
          <div className="about-section__media">
            <div className="about-section__visual">
              <img
                src={aboutPreview}
                alt="Vista conceptual de una presencia digital profesional"
                className="about-section__image"
                loading="lazy"
              />
            </div>

            <div className="about-section__stats">
              {stats.map((item) => (
                <article key={item.id} className="about-section__stat">
                  <span className="about-section__stat-value">{item.value}</span>
                  <span className="about-section__stat-label">{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="about-section__content">
            <p className="section__eyebrow">Quién trabajará tu página</p>

            <h2 className="section__title">
              Trabajo para que tu negocio tenga una página clara, profesional y útil para vender mejor
            </h2>

            <p className="section__text">
              Soy Genaro Hernández Piñeiro y me dedico a crear y mejorar páginas
              web para negocios que necesitan verse mejor en internet y transmitir
              más confianza desde el primer vistazo.
            </p>

            <p className="section__text">
              Mi enfoque no es llenar una página de cosas innecesarias. Lo
              importante es que el sitio ayude a explicar bien tu negocio, se vea
              profesional y facilite que una persona interesada te contacte.
            </p>

            <p className="section__text">
              Trabajo tanto en proyectos nuevos como en sitios que ya existen y
              necesitan una actualización para verse más actuales, más claros y
              mejor organizados.
            </p>

            <div className="about-section__principles">
              {principles.map((item) => (
                <article key={item.id} className="about-section__principle">
                  <h3 className="about-section__principle-title">{item.title}</h3>
                  <p className="about-section__principle-text">{item.text}</p>
                </article>
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
                  Hacer que una página se vea mejor, se entienda mejor y ayude más al negocio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;