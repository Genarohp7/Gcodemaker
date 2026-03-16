import projects from "../../data/projects";

function ProjectsSection() {
  const featuredProject = projects.find((project) => project.featured);
  const secondaryProjects = projects.filter((project) => !project.featured);

  const featuredNotes = featuredProject?.notes ?? [];
  const featuredStack = featuredProject?.stack ?? [];

  return (
    <section id="proyectos" className="section">
      <div className="section__container">
        <p className="section__eyebrow">Proyectos</p>
        <h2 className="section__title">Trabajo reciente y proyectos relevantes</h2>
        <p className="section__text section__text--intro">
          Aquí muestro proyectos con distintos enfoques, desde soluciones más
          comerciales hasta plataformas con una estructura más robusta. La idea
          no es enseñar cajas bonitas: es mostrar criterio, construcción y evolución.
        </p>

        {featuredProject ? (
          <article className="projects__featured">
            <div className="projects__featured-media">
              <div className="projects__featured-image-wrap">
                <img
                  src={featuredProject.imageSrc}
                  alt={featuredProject.imageAlt}
                  className="projects__featured-image"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="projects__featured-content">
              <p className="projects__featured-label">Proyecto destacado</p>
              <p className="projects__tag">{featuredProject.category}</p>

              <h3 className="projects__featured-title">
                {featuredProject.name}
              </h3>

              <p className="projects__featured-highlight">
                {featuredProject.highlight}
              </p>

              <p className="projects__description">
                {featuredProject.description}
              </p>

              <p className="projects__featured-summary">
                {featuredProject.summary}
              </p>

              <ul className="projects__stack">
                {featuredStack.map((item) => (
                  <li key={item} className="projects__stack-item">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="projects__actions">
                <a
                  href={featuredProject.url}
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                >
                  {featuredProject.cta}
                </a>
              </div>
            </div>

            <div className="projects__featured-side">
              {featuredNotes.map((note) => (
                <div key={note} className="projects__featured-box">
                  <span className="projects__featured-box-label">Punto clave</span>
                  <p className="projects__featured-box-text">{note}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <div className="projects__secondary-header">
          <h3 className="projects__secondary-title">Más proyectos</h3>
          <p className="projects__secondary-text">
            Otros trabajos que también forman parte de mi evolución y del tipo de soluciones que puedo construir.
          </p>
        </div>

        <div className="projects">
          {secondaryProjects.map((project) => (
            <article key={project.id} className="projects__card">
              <div className="projects__card-media">
                <img
                  src={project.imageSrc}
                  alt={project.imageAlt}
                  className="projects__card-image"
                  loading="lazy"
                />
              </div>

              <div className="projects__top">
                <p className="projects__tag">{project.category}</p>
                <p className="projects__highlight">{project.highlight}</p>
              </div>

              <h3 className="projects__title">{project.name}</h3>

              <p className="projects__description">{project.description}</p>
              <p className="projects__card-summary">{project.summary}</p>

              <ul className="projects__stack">
                {(project.stack ?? []).map((item) => (
                  <li key={item} className="projects__stack-item">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="projects__actions">
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="projects__link"
                  >
                    {project.cta}
                  </a>
                ) : (
                  <span className="projects__link projects__link--disabled">
                    {project.cta}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;