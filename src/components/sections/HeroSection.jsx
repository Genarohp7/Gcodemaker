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
        Build. Present. Convert.
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const heroPreview = createHeroPreview();

function HeroSection() {
  const tags = [
    "Sitios informativos",
    "Landing pages",
    "React + Vite",
    "UI clara y profesional",
    "Experiencias web funcionales",
  ];

  const metrics = [
    {
      id: "claridad",
      value: "UX clara",
      label: "Estructura pensada para que el usuario entienda rápido lo importante.",
    },
    {
      id: "presencia",
      value: "Imagen sólida",
      label: "Diseño y desarrollo para que un negocio se vea más confiable y profesional.",
    },
    {
      id: "desarrollo",
      value: "Código real",
      label: "Soluciones construidas con criterio técnico, no solo con buena intención.",
    },
  ];

  return (
    <section id="inicio" className="hero">
      <div className="hero__container hero__container--grid">
        <div className="hero__main">
          <p className="hero__eyebrow">Desarrollo web para negocios y marcas</p>

          <h1 className="hero__title">
            Diseño y desarrollo experiencias web que ayudan a presentar mejor un
            negocio, comunicar con claridad y dar una imagen más profesional.
          </h1>

          <p className="hero__description">
            Soy Genaro Hernández Piñeiro, desarrollador web enfocado en crear
            sitios modernos, funcionales y bien estructurados para negocios,
            marcas y proyectos que necesitan una presencia digital más seria.
          </p>

          <p className="hero__description hero__description--secondary">
            Trabajo con HTML, CSS, JavaScript, React y Node para construir
            soluciones claras, útiles y visualmente sólidas. Menos relleno,
            menos humo y más intención en cada pantalla.
          </p>

          <div className="hero__actions">
            <a href="#proyectos" className="button button--primary">
              Ver proyectos
            </a>

            <a href="#contacto" className="button button--secondary">
              Hablemos de tu proyecto
            </a>
          </div>

          <ul className="hero__tags">
            {tags.map((item) => (
              <li key={item} className="hero__tag">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="hero__panel">
          <div className="hero__panel-card">
            <p className="hero__panel-label">Vista conceptual</p>

            <div className="hero__preview">
              <img
                src={heroPreview}
                alt="Vista conceptual de una interfaz web moderna"
                className="hero__preview-image"
                loading="eager"
              />
            </div>

            <div className="hero__metrics">
              {metrics.map((item) => (
                <article key={item.id} className="hero__metric">
                  <span className="hero__metric-value">{item.value}</span>
                  <span className="hero__metric-label">{item.label}</span>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default HeroSection;