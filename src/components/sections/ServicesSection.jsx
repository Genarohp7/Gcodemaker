function ServicesSection() {
  const services = [
    {
      id: "sitios-informativos",
      title: "Sitios web informativos",
      description:
        "Páginas claras y profesionales para presentar tu negocio, tus servicios, tu propuesta de valor y tus medios de contacto de forma ordenada.",
    },
    {
      id: "landing-pages",
      title: "Landing pages",
      description:
        "Páginas pensadas para comunicar una oferta puntual, captar prospectos y guiar al usuario hacia una acción concreta sin ruido innecesario.",
    },
    {
      id: "redisenos",
      title: "Rediseño y mejora web",
      description:
        "Si tu sitio actual se ve desactualizado, confuso o poco profesional, puedo ayudarte a reorganizarlo y darle una presentación mucho más sólida.",
    },
  ];

  return (
    <section id="servicios" className="section section--alt">
      <div className="section__container">
        <p className="section__eyebrow">Servicios</p>
        <h2 className="section__title">
          Soluciones web pensadas para comunicar mejor y dar una imagen más profesional
        </h2>
        <p className="section__text section__text--intro">
          No todos los proyectos necesitan lo mismo. A veces hace falta una
          landing clara, otras un sitio completo que explique mejor lo que hace
          tu negocio. La idea es construir una solución útil, bien presentada y
          con objetivos claros.
        </p>

        <div className="services">
          {services.map((service) => (
            <article key={service.id} className="services__card">
              <p className="services__label">Servicio</p>
              <h3 className="services__title">{service.title}</h3>
              <p className="services__text">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;