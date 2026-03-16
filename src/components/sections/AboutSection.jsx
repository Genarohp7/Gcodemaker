function AboutSection() {
  const strengths = [
    "Enfoque claro en estructura, presentación y funcionalidad",
    "Comunicación directa y trabajo ordenado por etapas",
    "Desarrollo pensado para negocios que necesitan verse mejor y transmitir confianza",
  ];

  return (
    <section id="sobre-mi" className="section">
      <div className="section__container">
        <div className="about-section">
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
              servicio o idea. No se trata solo de “que se vea bonito”, sino de
              construir una herramienta útil y bien pensada.
            </p>

            <p className="section__text">
              Trabajo con HTML, CSS, JavaScript, React y Node, y disfruto
              convertir necesidades reales en soluciones web limpias,
              funcionales y adaptables. Me tomo cada proyecto con seriedad,
              orden y atención al detalle.
            </p>
          </div>

          <aside className="about-section__card">
            <p className="about-section__card-label">Lo que aporto</p>

            <ul className="about-section__list">
              {strengths.map((item) => (
                <li key={item} className="about-section__item">
                  {item}
                </li>
              ))}
            </ul>

            <div className="about-section__stack">
              <span className="about-section__stack-item">HTML</span>
              <span className="about-section__stack-item">CSS</span>
              <span className="about-section__stack-item">JavaScript</span>
              <span className="about-section__stack-item">React</span>
              <span className="about-section__stack-item">Node</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;