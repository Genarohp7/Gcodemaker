function HeroSection() {
  const highlights = [
    "Sitios informativos",
    "Landing pages",
    "Rediseño web",
    "React + Vite",
    "HTML, CSS y JavaScript",
  ];

  const metrics = [
    {
      id: "enfoque",
      value: "100%",
      label: "Enfoque en claridad y presentación",
    },
    {
      id: "stack",
      value: "Front-end",
      label: "Base sólida para experiencias modernas",
    },
    {
      id: "objetivo",
      value: "1 meta",
      label: "Que tu sitio comunique mejor y se vea profesional",
    },
  ];

  return (
    <section id="inicio" className="hero">
      <div className="hero__container hero__container--grid">
        <div className="hero__main">
          <p className="hero__eyebrow">Desarrollo web para negocios y marcas</p>

          <h1 className="hero__title">
            Desarrollo sitios web claros, modernos y funcionales para negocios
            que necesitan una presencia digital más profesional.
          </h1>

          <p className="hero__description">
            Soy Genaro Hernández Piñeiro, desarrollador web enfocado en crear
            páginas que no solo se vean bien, sino que comuniquen mejor, generen
            confianza y ayuden a presentar un negocio con más claridad.
          </p>

          <p className="hero__description hero__description--secondary">
            Trabajo con HTML, CSS, JavaScript, React y Node para construir
            experiencias web limpias, útiles y bien pensadas. Menos adorno vacío,
            más estructura, más intención y mejor presencia digital.
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
            {highlights.map((item) => (
              <li key={item} className="hero__tag">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="hero__panel">
          <div className="hero__panel-card">
            <p className="hero__panel-label">Presentación profesional</p>

            <h2 className="hero__panel-title">
              Un sitio web bien hecho no es lujo: es una herramienta para dar
              confianza.
            </h2>

            <p className="hero__panel-text">
              Un negocio puede tener un gran servicio, pero si su presencia
              digital se ve descuidada, confusa o vieja, pierde fuerza desde el
              primer vistazo. Ahí es donde entra un sitio mejor construido.
            </p>

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