function FinalCtaSection() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="section__container">
        <div className="final-cta__box">
          <div className="final-cta__content">
            <p className="final-cta__eyebrow">Da el siguiente paso</p>

            <h2 id="final-cta-title" className="final-cta__title">
              Si quieres una página web que ayude a tu negocio a verse mejor y conseguir más clientes, este es el momento de empezar
            </h2>

            <p className="final-cta__text">
              Una buena página no solo sirve para estar en internet. Sirve para
              dar confianza, explicar mejor lo que haces y facilitar que una
              persona interesada te contacte.
            </p>
          </div>

          <div className="final-cta__actions">
            <a href="#contacto" className="button button--primary">
              Solicitar mi página
            </a>

            <a href="#proyectos" className="button button--secondary">
              Ver ejemplos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;