function ProcessSection() {
  const steps = [
    {
      id: "descubrimiento",
      number: "01",
      title: "Entiendo el objetivo",
      text: "Primero aterrizo qué necesita tu negocio, qué quieres comunicar y qué papel debe cumplir el sitio dentro de esa meta.",
    },
    {
      id: "estructura",
      number: "02",
      title: "Organizo la estructura",
      text: "Defino una base clara para que el contenido tenga lógica, el recorrido sea fácil y la información importante no quede enterrada.",
    },
    {
      id: "desarrollo",
      number: "03",
      title: "Desarrollo y ajusto",
      text: "Construyo la solución cuidando presentación, funcionalidad y adaptación a distintos dispositivos, haciendo ajustes cuando hace falta.",
    },
  ];

  return (
    <section id="proceso" className="section section--alt">
      <div className="section__container">
        <p className="section__eyebrow">Proceso</p>
        <h2 className="section__title">
          Una forma de trabajo clara, ordenada y enfocada en resultados
        </h2>
        <p className="section__text section__text--intro">
          Me gusta trabajar por etapas para que cada proyecto tenga dirección,
          coherencia y una ejecución más limpia. Menos improvisación, menos
          humo, mejores resultados.
        </p>

        <div className="process">
          {steps.map((step) => (
            <article key={step.id} className="process__step">
              <span className="process__number">{step.number}</span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__text">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;