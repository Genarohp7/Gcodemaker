import { useEffect, useState } from "react";
import {
  acceptConsent,
  getConsentDecision,
  rejectConsent,
} from "../../lib/analytics";

function CookieBanner() {
  const [decision, setDecision] = useState(() => getConsentDecision());
  const [isVisible, setIsVisible] = useState(() => !getConsentDecision());

  useEffect(() => {
    function handleConsentChange(event) {
      const nextDecision = event.detail?.decision ?? getConsentDecision();
      setDecision(nextDecision);
      setIsVisible(!nextDecision);
    }

    window.addEventListener("gcodemaker:consent-change", handleConsentChange);

    return () => {
      window.removeEventListener(
        "gcodemaker:consent-change",
        handleConsentChange
      );
    };
  }, []);

  function handleAccept() {
    acceptConsent();
    setDecision("granted");
    setIsVisible(false);
  }

  function handleReject() {
    rejectConsent();
    setDecision("denied");
    setIsVisible(false);
  }

  if (!isVisible || decision) return null;

  return (
    <aside
      className="cookie-banner"
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <div className="cookie-banner__content">
        <div className="cookie-banner__copy">
          <p className="cookie-banner__eyebrow">Cookies</p>
          <h2 id="cookie-banner-title" className="cookie-banner__title">
            Usamos cookies para medir y mejorar la experiencia
          </h2>
          <p
            id="cookie-banner-description"
            className="cookie-banner__description"
          >
            Utilizamos cookies y herramientas de medición para entender cómo se
            usa la página, mejorar su funcionamiento y analizar resultados. Tú
            decides si aceptas esta medición.
          </p>
        </div>

        <div className="cookie-banner__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleReject}
          >
            Solo necesarias
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={handleAccept}
          >
            Aceptar
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CookieBanner;