function FinalCtaSection() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="section__container">
        <div className="final-cta__box">
          <div className="final-cta__content">
            <p className="final-cta__eyebrow">Siguiente paso</p>
            <h2 id="final-cta-title" className="final-cta__title">
              Si tu negocio necesita una presencia digital más clara y profesional,
              es buen momento para construirla mejor.
            </h2>
            <p className="final-cta__text">
              Un sitio bien planteado puede ayudarte a comunicar mejor, generar
              más confianza y presentar tu negocio con más seriedad desde el
              primer vistazo.
            </p>
          </div>

          <div className="final-cta__actions">
            <a href="#contacto" className="button button--primary">
              Quiero mejorar mi sitio
            </a>

            <a
              href="https://github.com/Genarohp7"
              target="_blank"
              rel="noreferrer"
              className="button button--secondary"
            >
              Ver trabajo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;