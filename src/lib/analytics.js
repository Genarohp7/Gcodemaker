const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CONSENT_STORAGE_KEY = "gcodemaker_cookie_consent_v1";
const GOOGLE_TAG_SCRIPT_ID = "gcodemaker-google-tag";

const CONSENT_GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
};

const CONSENT_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

let analyticsInitialized = false;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function ensureDataLayer() {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function injectGoogleTag() {
  if (!GA_MEASUREMENT_ID) return;
  if (document.getElementById(GOOGLE_TAG_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = GOOGLE_TAG_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function getConsentPayload(decision) {
  return decision === "granted" ? CONSENT_GRANTED : CONSENT_DENIED;
}

function dispatchConsentEvent(decision) {
  window.dispatchEvent(
    new CustomEvent("gcodemaker:consent-change", {
      detail: { decision },
    })
  );
}

export function getConsentDecision() {
  if (!isBrowser()) return null;

  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);

  return value === "granted" || value === "denied" ? value : null;
}

export function hasConsentDecision() {
  return getConsentDecision() !== null;
}

export function saveConsentDecision(decision) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
}

export function clearConsentDecision() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  dispatchConsentEvent(null);
}

export function updateConsent(decision) {
  if (!isBrowser()) return;
  if (!window.gtag) return;

  window.gtag("consent", "update", getConsentPayload(decision));
  saveConsentDecision(decision);
  dispatchConsentEvent(decision);
}

export function acceptConsent() {
  updateConsent("granted");
}

export function rejectConsent() {
  updateConsent("denied");
}

export function initAnalytics() {
  if (!isBrowser()) return false;
  if (!GA_MEASUREMENT_ID) return false;

  ensureDataLayer();
  injectGoogleTag();

  if (!analyticsInitialized) {
    window.gtag("consent", "default", {
      ...CONSENT_DENIED,
    });

    window.gtag("js", new Date());

    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });

    analyticsInitialized = true;
  }

  const storedDecision = getConsentDecision();

  if (storedDecision) {
    window.gtag("consent", "update", getConsentPayload(storedDecision));
  }

  return true;
}

export function trackPageView({
  page_title = document.title,
  page_location = window.location.href,
  page_path = `${window.location.pathname}${window.location.search}`,
} = {}) {
  if (!isBrowser()) return;
  if (!window.gtag || !GA_MEASUREMENT_ID) return;

  window.gtag("event", "page_view", {
    page_title,
    page_location,
    page_path,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!isBrowser()) return;
  if (!window.gtag || !GA_MEASUREMENT_ID) return;

  window.gtag("event", eventName, params);
}

export function getMeasurementId() {
  return GA_MEASUREMENT_ID;
}