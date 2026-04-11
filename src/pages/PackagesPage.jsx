import { Link } from "react-router";

function PackagesPage() {
  const promo = {
    title: "Página de Arranque",
    price: "$2,500 MXN",
    subtitle: "Una promoción pensada para empezar rápido",
    description:
      "Ideal para negocios que necesitan salir a internet con una imagen clara y profesional sin hacer una inversión grande al inicio.",
    includes: [
      "Una página de presentación",
      "Información principal del negocio",
      "Botón de contacto directo",
      "Diseño adaptable a celular",
      "Imagen profesional para empezar a mostrarse mejor",
    ],
    excludes: [
      "Funciones especiales o sistemas personalizados",
      "Varias páginas o secciones avanzadas",
      "Procesos internos como citas, reservas o administración",
      "Cambios ilimitados",
      "Costos de dominio, hospedaje o herramientas externas que cobren por uso",
    ],
  };

  const packages = [
    {
      id: "presencia-profesional",
      name: "Presencia Profesional",
      price: "Desde $4,900 MXN",
      audience: "Para negocios que quieren una página completa y profesional",
      benefit:
        "Ayuda a que tu negocio se vea formal, genere más confianza y tenga una presencia digital sólida.",
      includes: [
        "Sitio web profesional con varias secciones",
        "Presentación clara del negocio",
        "Sección de servicios",
        "Información de contacto visible",
        "Botones para facilitar el contacto",
        "Diseño adaptable a celular",
        "Optimización básica para ayudarte a aparecer mejor en Google",
      ],
      excludes: [
        "Funciones especiales hechas a la medida",
        "Sistemas para citas, reservas o administración",
        "Integraciones avanzadas",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
      ],
    },
    {
      id: "impulso-comercial",
      name: "Impulso Comercial",
      price: "Desde $8,900 MXN",
      audience:
        "Para negocios que quieren una página enfocada en conseguir clientes",
      benefit:
        "Ayuda a que tu página no solo se vea bien, sino que también trabaje mejor para atraer y convertir clientes.",
      includes: [
        "Todo lo del paquete anterior",
        "Mejor estructura para guiar al cliente",
        "Más secciones para explicar mejor el negocio",
        "Espacios para generar más confianza",
        "Presentación más completa y comercial",
        "Enfoque más claro en captar contactos",
        "Formularios sencillos para facilitar el contacto",
        "Optimización más completa para ayudarte a aparecer mejor en Google",
        "Medición conectada con Google Analytics para revisar visitas y acciones importantes",
      ],
      excludes: [
        "Sistemas personalizados complejos",
        "Procesos internos avanzados",
        "Funciones especiales fuera del alcance del paquete",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
      ],
      highlighted: true,
    },
    {
      id: "sistema-de-crecimiento",
      name: "Sistema de Crecimiento",
      price: "Desde $24,900 MXN",
      audience: "Para negocios que necesitan una solución más completa",
      benefit:
        "Convierte tu página en una herramienta de trabajo real para organizar mejor la atención, ahorrar tiempo y crecer.",
      includes: [
        "Todo lo del paquete anterior",
        "Funciones personalizadas según tu negocio",
        "Agenda de citas o reservas",
        "Panel para administrar información",
        "Formularios más completos",
        "Herramientas para ordenar procesos y atención",
      ],
      excludes: [
        "Precio único para todos los casos",
        "Funciones ilimitadas sin revisión previa",
        "Alcance indefinido",
        "Costos de dominio, hospedaje, licencias o herramientas externas que cobren por uso",
        "Costos variables de servidor, servicios de envío de correos u otras plataformas que se cobran según el uso",
      ],
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero__container">
          <div className="section__container--narrow">
            <p className="hero__eyebrow">Promociones y paquetes</p>
            <h1 className="hero__title">
              Opciones claras para crear o mejorar la página web de tu negocio
            </h1>
            <p className="hero__description">
              Aquí puedes ver una promoción de entrada para empezar rápido y los
              paquetes principales para negocios que buscan una solución más
              completa, más profesional y más útil para conseguir clientes.
            </p>

            <div className="hero__actions">
              <a
                href="https://wa.me/525567359470"
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
              >
                Quiero solicitar información
              </a>

              <Link to="/" className="button button--secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="section__container">
          <div className="services-section__header">
            <div className="services-section__copy">
              <p className="section__eyebrow">Promoción de entrada</p>
              <h2 className="section__title">
                {promo.title} — {promo.price}
              </h2>
              <p className="section__text section__text--intro">
                {promo.subtitle}
              </p>
              <p className="section__text">{promo.description}</p>
            </div>

            <aside className="services-section__panel">
              <div className="services-section__panel-box">
                <span className="services-section__panel-label">Ideal para</span>
                <p className="services-section__panel-text">
                  Negocios que quieren empezar con buena imagen, contacto claro y
                  una inversión más ligera.
                </p>
              </div>

              <div className="services-section__panel-box">
                <span className="services-section__panel-label">Importante</span>
                <p className="services-section__panel-text">
                  Esta promoción funciona como puerta de entrada para después
                  crecer hacia una solución más completa si tu negocio lo
                  necesita.
                </p>
              </div>
            </aside>
          </div>

          <div className="projects__featured projects__featured--primary">
            <div className="projects__featured-content">
              <p className="projects__featured-label">Promoción activa</p>
              <p className="projects__featured-status">Precio de arranque</p>
              <h3 className="projects__featured-title">{promo.title}</h3>
              <p className="projects__featured-highlight">{promo.price}</p>
              <p className="projects__featured-summary">{promo.description}</p>

              <div className="projects__actions">
                <a
                  href="https://wa.me/525567359470"
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                >
                  Quiero esta promoción
                </a>
              </div>
            </div>

            <div className="projects__featured-side">
              <div className="projects__featured-box">
                <span className="projects__featured-box-label">Incluye</span>
                <ul className="services__list">
                  {promo.includes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="projects__featured-box">
                <span className="projects__featured-box-label">No incluye</span>
                <ul className="services__list">
                  {promo.excludes.map((item) => (
                    <li key={item} className="services__item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__container">
          <p className="section__eyebrow">Paquetes principales</p>
          <h2 className="section__title">
            Elige la opción que mejor se adapte al momento de tu negocio
          </h2>
          <p className="section__text section__text--intro">
            Estos paquetes están pensados para que puedas empezar con una base
            profesional y, si lo necesitas, crecer hacia una solución más
            completa.
          </p>

          <div className="services services--enhanced">
            {packages.map((pkg) => (
              <article
                key={pkg.id}
                className={`services__card services__card--enhanced ${
                  pkg.highlighted ? "projects__featured--primary" : ""
                }`}
              >
                <div className="services__top">
                  <p className="services__label">{pkg.name}</p>

                  <div className="services__icon" aria-hidden="true">
                    <span className="services__icon-dot"></span>
                    <span className="services__icon-line"></span>
                  </div>
                </div>

                <h3 className="services__title">{pkg.price}</h3>
                <p className="services__text">
                  <strong>Para quién es:</strong> {pkg.audience}
                </p>
                <p className="services__text">
                  <strong>Beneficio principal:</strong> {pkg.benefit}
                </p>

                <div className="about-section__principles">
                  <article className="about-section__principle">
                    <h4 className="about-section__principle-title">Incluye</h4>
                    <ul className="services__list">
                      {pkg.includes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="about-section__principle">
                    <h4 className="about-section__principle-title">
                      No incluye
                    </h4>
                    <ul className="services__list">
                      {pkg.excludes.map((item) => (
                        <li key={item} className="services__item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                <div className="projects__actions">
                  <a
                    href="https://wa.me/525567359470"
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                  >
                    Solicitar este paquete
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="final-cta"
        aria-labelledby="packages-final-cta-title"
      >
        <div className="section__container">
          <div className="final-cta__box">
            <div className="final-cta__content">
              <p className="final-cta__eyebrow">¿No sabes cuál elegir?</p>
              <h2 id="packages-final-cta-title" className="final-cta__title">
                Te ayudo a elegir la mejor opción para tu negocio
              </h2>
              <p className="final-cta__text">
                Si todavía no tienes claro cuál promoción o paquete te conviene,
                podemos revisar tu caso y definir la opción más adecuada según el
                momento de tu negocio.
              </p>
            </div>

            <div className="final-cta__actions">
              <a
                href="https://wa.me/525567359470"
                target="_blank"
                rel="noreferrer"
                className="button button--primary"
              >
                Quiero asesoría
              </a>

              <a href="/#contacto" className="button button--secondary">
                Ir al contacto
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PackagesPage;