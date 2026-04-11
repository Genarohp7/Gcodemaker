function ProcessSection() {
  const steps = [
    {
      id: "contacto",
      number: "01",
      title: "Me cuentas qué necesita tu negocio",
      text: "Primero revisamos qué tipo de página necesitas, qué quieres comunicar y cuál es el objetivo principal: vender más, generar confianza o facilitar el contacto.",
    },
    {
      id: "propuesta",
      number: "02",
      title: "Definimos la mejor opción para ti",
      text: "Después organizamos la idea para que tu página tenga una estructura clara, una presentación profesional y un enfoque útil para tu tipo de negocio.",
    },
    {
      id: "entrega",
      number: "03",
      title: "Desarrollo, ajusto y dejamos todo listo",
      text: "Construyo la página, hago los ajustes necesarios y la dejo preparada para que tu negocio tenga una presencia digital más seria, más clara y más efectiva.",
    },
  ];

  return (
    <section id="proceso" className="section section--alt">
      <div className="section__container">
        <p className="section__eyebrow">Cómo trabajamos</p>
        <h2 className="section__title">
          Un proceso simple para que tu página avance sin complicaciones
        </h2>
        <p className="section__text section__text--intro">
          La idea es que todo sea claro desde el inicio: entender qué necesita tu
          negocio, definir la mejor solución y desarrollar una página que te ayude
          a verte mejor y a conseguir más oportunidades.
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