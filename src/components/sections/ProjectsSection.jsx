import { useEffect, useState } from "react";
import projects from "../../data/projects";

function ProjectsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalProjects = projects.length;
  const currentProject = projects[currentIndex];

  useEffect(() => {
    if (totalProjects <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalProjects);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [totalProjects]);

  function handlePrev() {
    setCurrentIndex((prev) => (prev - 1 + totalProjects) % totalProjects);
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % totalProjects);
  }

  function handleGoTo(index) {
    setCurrentIndex(index);
  }

  if (!currentProject) return null;

  const projectNotes = currentProject.notes ?? [];
  const projectStack = currentProject.stack ?? [];

  return (
    <section id="proyectos" className="section">
      <div className="section__container">
        <p className="section__eyebrow">Proyectos</p>
        <h2 className="section__title">
          Proyectos reales, mejoras y soluciones en evolución
        </h2>
        <p className="section__text section__text--intro">
          Aquí muestro proyectos de distintos tipos: algunos nacen desde cero y
          otros demuestran cómo una idea o una presentación pueden mejorar mucho
          cuando se trabaja con más claridad, mejor estructura y una imagen más
          profesional.
        </p>

        <div className="projects__carousel">
          <div className="projects__carousel-header">
            <div className="projects__carousel-copy">
              <h3 className="projects__carousel-title">{currentProject.name}</h3>
              <p className="projects__carousel-text">
                {currentProject.featured
                  ? "Proyecto principal del portafolio"
                  : "Proyecto destacado dentro del carrusel"}
              </p>
            </div>

            <div className="projects__carousel-controls">
              <span className="projects__carousel-pager">
                {currentIndex + 1} / {totalProjects}
              </span>

              <button
                type="button"
                className="projects__carousel-btn"
                onClick={handlePrev}
                aria-label="Proyecto anterior"
              >
                ←
              </button>

              <button
                type="button"
                className="projects__carousel-btn"
                onClick={handleNext}
                aria-label="Proyecto siguiente"
              >
                →
              </button>
            </div>
          </div>

          <article
            key={currentProject.id}
            className={`projects__featured projects__featured--carousel ${
              currentProject.featured ? "projects__featured--primary" : ""
            }`}
          >
            <div className="projects__featured-media">
              <div className="projects__featured-image-wrap">
                <img
                  src={currentProject.imageSrc}
                  alt={currentProject.imageAlt}
                  className="projects__featured-image"
                  loading="lazy"
                />
              </div>

              {currentProject.logoSrc ? (
                <div className="projects__media-brand">
                  <img
                    src={currentProject.logoSrc}
                    alt={
                      currentProject.logoAlt ?? `Logo de ${currentProject.name}`
                    }
                    className="projects__media-brand-logo"
                    loading="lazy"
                    width="64"
                    height="64"
                  />

                  <div className="projects__media-brand-copy">
                    <span className="projects__media-brand-name">
                      {currentProject.name}
                    </span>
                    <span className="projects__media-brand-subtitle">
                      {currentProject.category}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="projects__featured-content">
              <div className="projects__featured-meta">
                <p className="projects__featured-label">
                  {currentProject.featured
                    ? "Proyecto estrella"
                    : "Proyecto del portafolio"}
                </p>
                <span className="projects__featured-status">
                  {currentProject.status}
                </span>
              </div>

              <p className="projects__tag">{currentProject.category}</p>

              <h3 className="projects__featured-title">{currentProject.name}</h3>

              <p className="projects__featured-highlight">
                {currentProject.description}
              </p>

              <p className="projects__featured-summary">
                {currentProject.summary}
              </p>

              <ul className="projects__stack">
                {projectStack.map((item) => (
                  <li key={item} className="projects__stack-item">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="projects__actions">
                {currentProject.url ? (
                  <a
                    href={currentProject.url}
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                  >
                    {currentProject.cta}
                  </a>
                ) : (
                  <span className="projects__link projects__link--disabled">
                    {currentProject.cta}
                  </span>
                )}
              </div>
            </div>

            <div className="projects__featured-side">
              {projectNotes.map((note) => (
                <div key={note} className="projects__featured-box">
                  <span className="projects__featured-box-label">
                    Punto clave
                  </span>
                  <p className="projects__featured-box-text">{note}</p>
                </div>
              ))}
            </div>
          </article>

          <div
            className="projects__carousel-dots"
            aria-label="Seleccionar proyecto"
          >
            {projects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`projects__carousel-dot ${
                  index === currentIndex
                    ? "projects__carousel-dot--active"
                    : ""
                }`}
                onClick={() => handleGoTo(index)}
                aria-label={`Ir al proyecto ${project.name}`}
                aria-current={index === currentIndex ? "true" : "false"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;