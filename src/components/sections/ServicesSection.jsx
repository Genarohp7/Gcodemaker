function ServicesSection() {
  const services = [
    {
      id: "sitios-informativos",
      label: "Base sólida",
      title: "Sitios web informativos",
      description:
        "Páginas claras y profesionales para presentar tu negocio, tus servicios, tu propuesta de valor y tus medios de contacto de forma ordenada.",
      includes: [
        "Estructura clara de contenido",
        "Diseño adaptable a móvil y desktop",
        "Presentación más confiable de tu negocio",
      ],
    },
    {
      id: "landing-pages",
      label: "Conversión",
      title: "Landing pages",
      description:
        "Páginas pensadas para comunicar una oferta puntual, captar prospectos y llevar al usuario hacia una acción concreta sin ruido innecesario.",
      includes: [
        "Mensaje enfocado en una sola meta",
        "Jerarquía visual clara",
        "Llamadas a la acción mejor planteadas",
      ],
    },
    {
      id: "redisenos",
      label: "Optimización",
      title: "Rediseño y mejora web",
      description:
        "Si tu sitio actual se ve desactualizado, confuso o poco profesional, puedo ayudarte a reorganizarlo y darle una presencia mucho más sólida.",
      includes: [
        "Mejor organización visual",
        "Ajuste de experiencia y claridad",
        "Renovación de imagen digital",
      ],
    },
  ];

  return (
    <section id="servicios" className="section section--alt">
      <div className="section__container">
        <div className="services-section__header">
          <div className="services-section__copy">
            <p className="section__eyebrow">Servicios</p>

            <h2 className="section__title">
              Soluciones web pensadas para comunicar mejor y verse más profesionales
            </h2>

            <p className="section__text section__text--intro">
              No todos los proyectos necesitan lo mismo. A veces hace falta una
              landing clara; otras, un sitio completo que explique mejor lo que
              hace un negocio. La idea es construir una solución útil, bien
              presentada y con objetivos claros.
            </p>
          </div>

          <aside className="services-section__panel">
            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                Enfoque de trabajo
              </span>
              <p className="services-section__panel-text">
                Diseño y desarrollo con una lógica simple: claridad primero,
                estructura después y presentación con intención al final.
              </p>
            </div>

            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                Lo importante
              </span>
              <p className="services-section__panel-text">
                Un sitio útil no solo se ve bien; también explica mejor, genera
                más confianza y ayuda a que el negocio se tome más en serio.
              </p>
            </div>
          </aside>
        </div>

        <div className="services services--enhanced">
          {services.map((service) => (
            <article key={service.id} className="services__card services__card--enhanced">
              <div className="services__top">
                <p className="services__label">{service.label}</p>

                <div className="services__icon" aria-hidden="true">
                  <span className="services__icon-dot"></span>
                  <span className="services__icon-line"></span>
                </div>
              </div>

              <h3 className="services__title">{service.title}</h3>
              <p className="services__text">{service.description}</p>

              <ul className="services__list">
                {service.includes.map((item) => (
                  <li key={item} className="services__item">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;