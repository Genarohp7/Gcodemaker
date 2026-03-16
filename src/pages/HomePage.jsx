import projects from "../data/projects";

function HomePage() {
  return (
    <>
      <section id="inicio" className="hero">
        <div className="hero__container">
          <p className="hero__eyebrow">Desarrollo web para negocios y marcas</p>
          <h1 className="hero__title">
            Creo sitios web claros, modernos y funcionales que ayudan a dar una
            mejor presencia digital.
          </h1>
          <p className="hero__description">
            Soy Genaro Hernández Piñeiro. Desarrollo experiencias web pensadas
            para comunicar mejor, generar confianza y convertir visitas en
            oportunidades reales.
          </p>

          <div className="hero__actions">
            <a href="#proyectos" className="button button--primary">
              Ver proyectos
            </a>
            <a href="#contacto" className="button button--secondary">
              Hablemos de tu proyecto
            </a>
          </div>
        </div>
      </section>

      <section id="sobre-mi" className="section">
        <div className="section__container">
          <p className="section__eyebrow">Sobre mí</p>
          <h2 className="section__title">Más que hacer páginas: construir confianza</h2>
          <p className="section__text">
            Me dedico al desarrollo web con un enfoque práctico: entender lo que
            necesita cada proyecto y convertirlo en una solución clara, útil y
            bien presentada. Me interesa que cada sitio se vea profesional, pero
            también que tenga sentido, orden y propósito.
          </p>
          <p className="section__text">
            Trabajo con tecnologías como HTML, CSS, JavaScript, React y Node, y
            me gusta colaborar con negocios que buscan dar un paso serio en su
            presencia digital.
          </p>
        </div>
      </section>

      <section id="servicios" className="section section--alt">
        <div className="section__container">
          <p className="section__eyebrow">Servicios</p>
          <h2 className="section__title">Qué puedo construir para tu negocio</h2>

          <div className="services">
            <article className="services__card">
              <h3 className="services__title">Sitios web informativos</h3>
              <p className="services__text">
                Páginas profesionales para mostrar tu negocio, tus servicios y
                tus medios de contacto con una estructura clara y confiable.
              </p>
            </article>

            <article className="services__card">
              <h3 className="services__title">Landing pages</h3>
              <p className="services__text">
                Páginas enfocadas en presentar una oferta, captar clientes y
                comunicar un mensaje puntual sin rodeos ni ruido innecesario.
              </p>
            </article>

            <article className="services__card">
              <h3 className="services__title">Mejora y rediseño web</h3>
              <p className="services__text">
                Si tu sitio actual ya se ve viejo, confuso o poco profesional,
                puedo ayudarte a reorganizarlo y darle una mejor presentación.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="proyectos" className="section">
        <div className="section__container">
          <p className="section__eyebrow">Proyectos</p>
          <h2 className="section__title">Trabajo reciente</h2>

          <div className="projects">
            {projects.map((project) => (
              <article key={project.id} className="projects__card">
                <p className="projects__tag">{project.category}</p>
                <h3 className="projects__title">{project.name}</h3>
                <p className="projects__description">{project.description}</p>

                <div className="projects__actions">
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="projects__link"
                    >
                      Ver proyecto
                    </a>
                  ) : (
                    <span className="projects__link projects__link--disabled">
                      Próximamente
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="section section--alt">
        <div className="section__container">
          <p className="section__eyebrow">Proceso</p>
          <h2 className="section__title">Cómo trabajo</h2>

          <div className="process">
            <article className="process__step">
              <span className="process__number">01</span>
              <h3 className="process__title">Escucho y aterrizo la idea</h3>
              <p className="process__text">
                Primero entiendo tu negocio, tus objetivos y lo que realmente
                necesitas comunicar.
              </p>
            </article>

            <article className="process__step">
              <span className="process__number">02</span>
              <h3 className="process__title">Diseño una estructura clara</h3>
              <p className="process__text">
                Ordeno el contenido para que el sitio tenga lógica, claridad y
                una experiencia agradable.
              </p>
            </article>

            <article className="process__step">
              <span className="process__number">03</span>
              <h3 className="process__title">Desarrollo y ajusto</h3>
              <p className="process__text">
                Construyo la solución cuidando funcionalidad, presentación y
                adaptabilidad en distintos dispositivos.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="contacto" className="section">
        <div className="section__container section__container--narrow">
          <p className="section__eyebrow">Contacto</p>
          <h2 className="section__title">¿Tienes una idea o un negocio que necesita mejorar su presencia digital?</h2>
          <p className="section__text">
            Estoy construyendo esta nueva versión del portafolio, pero ya puedes
            contactarme para hablar de tu proyecto.
          </p>

          <div className="contact-card">
            <a
              href="mailto:genaro@example.com"
              className="button button--primary"
            >
              Enviar correo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;