function SolutionSection() {
  const solutions = [
    {
      id: "presentacion",
      label: "Qué resuelve",
      title: "Una mejor presentación para tu negocio",
      description:
        "Una página bien hecha ayuda a que una persona entienda rápido qué ofreces, cómo ayudas y por qué debería confiar en ti.",
      includes: [
        "Información clara desde el primer vistazo",
        "Imagen más profesional para generar confianza",
        "Una base digital que ayuda a vender mejor",
      ],
    },
    {
      id: "orden",
      label: "Qué resuelve",
      title: "Orden y claridad en tu información",
      description:
        "Cuando la información está bien organizada, el cliente encuentra más fácil lo que necesita y tiene menos dudas antes de contactarte.",
      includes: [
        "Servicios, horarios y contacto más fáciles de encontrar",
        "Menos confusión para el cliente",
        "Un recorrido más claro dentro de tu página",
      ],
    },
    {
      id: "resultado",
      label: "Qué resuelve",
      title: "Una herramienta útil para conseguir contactos",
      description:
        "La idea no es solo tener una página bonita, sino una herramienta que ayude a tu negocio a recibir más preguntas, más mensajes y más oportunidades.",
      includes: [
        "Botones y llamadas a la acción bien ubicados",
        "Camino más directo para que te contacten",
        "Presencia digital pensada para generar resultados",
      ],
    },
  ];

  return (
    <section id="solucion" className="section">
      <div className="section__container">
        <div className="services-section__header">
          <div className="services-section__copy">
            <p className="section__eyebrow">La solución</p>

            <h2 className="section__title">
              Una página web clara y profesional puede ayudarte a vender mejor
            </h2>

            <p className="section__text section__text--intro">
              La solución no es solo “tener una página”. La verdadera diferencia
              está en tener una página que explique bien tu negocio, transmita
              confianza y facilite que una persona te contacte.
            </p>
          </div>

          <aside className="services-section__panel">
            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                Qué buscamos
              </span>
              <p className="services-section__panel-text">
                Que tu negocio se vea profesional, se entienda rápido y tenga
                una presencia digital que sí ayude a generar oportunidades.
              </p>
            </div>

            <div className="services-section__panel-box">
              <span className="services-section__panel-label">
                Cómo se logra
              </span>
              <p className="services-section__panel-text">
                Con una página bien organizada, visualmente clara y pensada para
                que el cliente encuentre lo importante sin esfuerzo.
              </p>
            </div>
          </aside>
        </div>

        <div className="services services--enhanced">
          {solutions.map((solution) => (
            <article
              key={solution.id}
              className="services__card services__card--enhanced"
            >
              <div className="services__top">
                <p className="services__label">{solution.label}</p>

                <div className="services__icon" aria-hidden="true">
                  <span className="services__icon-dot"></span>
                  <span className="services__icon-line"></span>
                </div>
              </div>

              <h3 className="services__title">{solution.title}</h3>
              <p className="services__text">{solution.description}</p>

              <ul className="services__list">
                {solution.includes.map((item) => (
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

export default SolutionSection;