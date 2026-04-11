function ServicesSection() {
  const services = [
    {
      id: "restaurantes",
      label: "Restaurantes",
      title: "Páginas web para restaurantes que quieren vender más",
      description:
        "Una página para restaurante debe ayudar a que las personas vean tu menú, encuentren tu negocio, conozcan tus promociones y te contacten rápido.",
      includes: [
        "Menú digital fácil de consultar",
        "Información clara de ubicación, horarios y contacto",
        "Presentación más profesional para atraer más clientes",
      ],
    },
    {
      id: "salud",
      label: "Sector salud",
      title: "Páginas web para clínicas, doctores y dentistas",
      description:
        "En salud, una buena página ayuda a transmitir confianza, explicar tus servicios con claridad y facilitar que un paciente te contacte o agende.",
      includes: [
        "Información profesional y fácil de entender",
        "Mayor confianza para nuevos pacientes",
        "Base lista para citas, contacto y presencia online",
      ],
    },
    {
      id: "negocios-pequenos",
      label: "Negocios pequeños",
      title: "Páginas web para negocios que van empezando",
      description:
        "Si tu negocio apenas está creciendo, una página web puede ayudarte a verte más serio, explicar mejor lo que haces y no depender solo de redes sociales.",
      includes: [
        "Presencia online clara y rápida de lanzar",
        "Mejor imagen para clientes nuevos",
        "Una base digital para empezar a vender con más confianza",
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
              Páginas web pensadas para ayudar a tu negocio a verse mejor y conseguir más clientes
            </h2>

            <p className="section__text section__text--intro">
              No todos los negocios necesitan lo mismo. Por eso el enfoque cambia
              según el tipo de cliente, el giro y lo que se necesita comunicar para
              vender mejor.
            </p>
          </div>

          <aside className="services-section__panel">
            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                Lo que buscamos
              </span>
              <p className="services-section__panel-text">
                Que tu negocio tenga una página clara, profesional y útil para que
                una persona entienda rápido qué ofreces y cómo puede contactarte.
              </p>
            </div>

            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                También mejoramos sitios existentes
              </span>
              <p className="services-section__panel-text">
                Si tu página actual se ve vieja, confusa o poco profesional, también
                puedo ayudarte a mejorarla para que transmita más confianza y funcione mejor.
              </p>
            </div>
          </aside>
        </div>

        <div className="services services--enhanced">
          {services.map((service) => (
            <article
              key={service.id}
              className="services__card services__card--enhanced"
            >
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