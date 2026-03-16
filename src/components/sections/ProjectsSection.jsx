import projects from "../../data/projects";

function ProjectsSection() {
  return (
    <section id="proyectos" className="section">
      <div className="section__container">
        <p className="section__eyebrow">Proyectos</p>
        <h2 className="section__title">Trabajo reciente y proyectos relevantes</h2>
        <p className="section__text section__text--intro">
          Estos proyectos muestran distintas formas de resolver necesidades
          reales: desde presentar mejor una marca hasta construir experiencias
          web más completas y funcionales.
        </p>

        <div className="projects">
          {projects.map((project) => (
            <article key={project.id} className="projects__card">
              <div className="projects__top">
                <p className="projects__tag">{project.category}</p>
                <p className="projects__highlight">{project.highlight}</p>
              </div>

              <h3 className="projects__title">{project.name}</h3>
              <p className="projects__description">{project.description}</p>

              <ul className="projects__stack">
                {project.stack.map((item) => (
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