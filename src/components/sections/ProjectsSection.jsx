import { useEffect, useState } from "react";
import { motion as Motion } from "motion/react";
import projects from "../../data/projects";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const projectCardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

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
        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Motion.p className="section__eyebrow" variants={itemVariants}>
            Proyectos
          </Motion.p>

          <Motion.h2 className="section__title" variants={itemVariants}>
            Proyectos reales, mejoras y soluciones en evolución
          </Motion.h2>

          <Motion.p
            className="section__text section__text--intro"
            variants={itemVariants}
          >
            Aquí muestro proyectos de distintos tipos: algunos nacen desde cero y
            otros demuestran cómo una idea o una presentación pueden mejorar mucho
            cuando se trabaja con más claridad, mejor estructura y una imagen más
            profesional.
          </Motion.p>
        </Motion.div>

        <Motion.div
          className="projects__carousel"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={containerVariants}
        >
          <Motion.div className="projects__carousel-header" variants={itemVariants}>
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

              <Motion.button
                type="button"
                className="projects__carousel-btn"
                onClick={handlePrev}
                aria-label="Proyecto anterior"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                ←
              </Motion.button>

              <Motion.button
                type="button"
                className="projects__carousel-btn"
                onClick={handleNext}
                aria-label="Proyecto siguiente"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                →
              </Motion.button>
            </div>
          </Motion.div>

          <Motion.article
            key={currentProject.id}
            className={`projects__featured projects__featured--carousel ${
              currentProject.featured ? "projects__featured--primary" : ""
            }`}
            variants={projectCardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4 }}
          >
            <div className="projects__featured-media">
              <Motion.div
                className="projects__featured-image-wrap"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <img
                  src={currentProject.imageSrc}
                  alt={currentProject.imageAlt}
                  className="projects__featured-image"
                  loading="lazy"
                />
              </Motion.div>

              {currentProject.logoSrc ? (
                <Motion.div
                  className="projects__media-brand"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                >
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
                </Motion.div>
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
                  <Motion.li
                    key={item}
                    className="projects__stack-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -2 }}
                  >
                    {item}
                  </Motion.li>
                ))}
              </ul>

              <div className="projects__actions">
                {currentProject.url ? (
                  <Motion.a
                    href={currentProject.url}
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {currentProject.cta}
                  </Motion.a>
                ) : (
                  <span className="projects__link projects__link--disabled">
                    {currentProject.cta}
                  </span>
                )}
              </div>
            </div>

            <div className="projects__featured-side">
              {projectNotes.map((note, index) => (
                <Motion.div
                  key={note}
                  className="projects__featured-box"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.06 + index * 0.06,
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                >
                  <span className="projects__featured-box-label">
                    Punto clave
                  </span>
                  <p className="projects__featured-box-text">{note}</p>
                </Motion.div>
              ))}
            </div>
          </Motion.article>

          <Motion.div
            className="projects__carousel-dots"
            aria-label="Seleccionar proyecto"
            variants={itemVariants}
          >
            {projects.map((project, index) => (
              <Motion.button
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
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.92 }}
              />
            ))}
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
}

export default ProjectsSection;