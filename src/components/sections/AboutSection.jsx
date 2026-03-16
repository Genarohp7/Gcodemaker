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
        Build with clarity
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
      title: "Claridad antes que adorno",
      text: "Me interesa que cada sitio explique bien lo importante y no obligue al usuario a adivinar qué sigue.",
    },
    {
      id: "estructura",
      title: "Estructura con intención",
      text: "Una buena página no solo se ve bien: ordena el contenido, guía la atención y transmite más confianza.",
    },
    {
      id: "ejecucion",
      title: "Ejecución seria",
      text: "Trabajo con atención al detalle, lógica de construcción y visión práctica para que cada proyecto tenga base real.",
    },
  ];

  const stack = ["HTML", "CSS", "JavaScript", "React", "Node"];
  const stats = [
    { id: "focus", value: "UX clara", label: "Experiencias pensadas para comunicar mejor" },
    { id: "build", value: "Front-end", label: "Base fuerte para productos modernos" },
    { id: "tone", value: "Sin humo", label: "Más criterio técnico, menos ornamento vacío" },
  ];

  return (
    <section id="sobre-mi" className="section">
      <div className="section__container">
        <div className="about-section about-section--enhanced">
          <div className="about-section__media">
            <div className="about-section__visual">
              <img
                src={aboutPreview}
                alt="Vista conceptual de un perfil profesional de desarrollador web"
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
            <p className="section__eyebrow">Sobre mí</p>

            <h2 className="section__title">
              Desarrollo web con enfoque práctico, visual y funcional
            </h2>

            <p className="section__text">
              Soy Genaro Hernández Piñeiro, desarrollador web enfocado en crear
              sitios claros, modernos y bien estructurados para negocios,
              marcas y proyectos que necesitan una presencia digital más seria y
              profesional.
            </p>

            <p className="section__text">
              Me interesa que cada página tenga sentido: que comunique bien, que
              se vea confiable y que ayude a presentar mejor un producto,
              servicio o idea. No se trata solo de que “se vea bonita”, sino de
              construir una herramienta útil y bien pensada.
            </p>

            <p className="section__text">
              Trabajo con HTML, CSS, JavaScript, React y Node, y disfruto
              convertir necesidades reales en soluciones limpias, funcionales y
              adaptables. Me tomo cada proyecto con seriedad, orden y atención
              al detalle.
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
                  Resolver con claridad, presentar con intención y construir con criterio técnico.
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