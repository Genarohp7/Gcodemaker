const FACEBOOK_SDK_SRC = "https://connect.facebook.net/es_LA/sdk.js";
export const META_EMBEDDED_SIGNUP_REDIRECT_URI = "https://gcodemaker.com.mx/gc-broadcast";

let sdkPromise = null;
const EMBEDDED_SIGNUP_COMPLETION_EVENTS = new Set([
  "FINISH",
  "FINISH_ONLY_WABA",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
]);

function ensureWaEmbeddedSignupDebug() {
  window.__waEmbeddedSignupDebug = window.__waEmbeddedSignupDebug || {
    lastPostMessages: [],
    lastCode: null,
    lastEmbeddedSignup: null,
  };

  return window.__waEmbeddedSignupDebug;
}

function pushWaEmbeddedSignupDebugMessage({ origin, rawData, parsedData }) {
  const debug = ensureWaEmbeddedSignupDebug();

  debug.lastPostMessages.push({
    origin,
    rawData,
    parsedData,
    timestamp: new Date().toISOString(),
  });

  debug.lastPostMessages = debug.lastPostMessages.slice(-20);
}

function isFacebookOrigin(origin) {
  try {
    const { hostname, protocol } = new URL(origin);

    return protocol === "https:" && (
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com")
    );
  } catch {
    return false;
  }
}

function parseStringPostMessageData(rawData) {
  try {
    return JSON.parse(rawData);
  } catch {
    console.log("[WA Embedded Signup] non JSON postMessage raw string", rawData);
  }

  if (!rawData.includes("=") && !rawData.includes("&")) {
    return null;
  }

  const params = new URLSearchParams(rawData);
  const parsedParams = Object.fromEntries(params.entries());

  console.log("[WA Embedded Signup] non JSON postMessage parsed params", parsedParams);

  if (parsedParams.data) {
    try {
      return JSON.parse(parsedParams.data);
    } catch {
      return parsedParams;
    }
  }

  return parsedParams;
}

function normalizeEmbeddedSignupMessage(rawData) {
  if (!rawData) {
    return null;
  }

  if (typeof rawData === "string") {
    return parseStringPostMessageData(rawData);
  }

  if (typeof rawData === "object") {
    return rawData;
  }

  return null;
}

function isEmbeddedSignupCompletion(embeddedSignup) {
  if (!embeddedSignup) {
    return false;
  }

  return (
    EMBEDDED_SIGNUP_COMPLETION_EVENTS.has(embeddedSignup.event) ||
    (embeddedSignup.event === "FINISH" && embeddedSignup.data?.is_wa_login_user === true)
  );
}

function toEmbeddedSignupPayload(data) {
  return {
    type: data.type,
    event: data.event || null,
    version: data.version ?? null,
    data: data.data ?? {},
    waba_id: data.data?.waba_id ?? null,
    phone_number_id: data.data?.phone_number_id ?? null,
    business_id: data.data?.business_id ?? data.data?.businessId ?? null,
    is_wa_login_user: data.data?.is_wa_login_user ?? null,
  };
}

function parseEmbeddedSignupMessage(event) {
  console.log("[WA Embedded Signup] postMessage received", {
    origin: event.origin,
    data: event.data,
    dataType: typeof event.data,
  });
  console.log("[WA Embedded Signup] postMessage raw event.data:", event.data);

  if (!isFacebookOrigin(event.origin)) {
    pushWaEmbeddedSignupDebugMessage({
      origin: event.origin,
      rawData: event.data,
      parsedData: null,
    });
    return null;
  }

  const normalizedData = normalizeEmbeddedSignupMessage(event.data);

  pushWaEmbeddedSignupDebugMessage({
    origin: event.origin,
    rawData: event.data,
    parsedData: normalizedData,
  });

  if (!normalizedData || normalizedData.type !== "WA_EMBEDDED_SIGNUP") {
    return null;
  }

  return toEmbeddedSignupPayload(normalizedData);
}

function getMetaConfig() {
  return {
    appId: import.meta.env.VITE_META_APP_ID,
    configId: import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID,
    graphVersion: import.meta.env.VITE_META_GRAPH_VERSION || "v23.0",
  };
}

function assertMetaConfig() {
  const config = getMetaConfig();

  if (!config.appId) {
    throw new Error("Falta configurar el App ID público de Meta para GC Broadcast.");
  }

  if (!config.configId) {
    throw new Error("Falta configurar el ID de configuración de Embedded Signup.");
  }

  return config;
}

function loadFacebookSdk() {
  if (window.FB) {
    return Promise.resolve(window.FB);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${FACEBOOK_SDK_SRC}"]`);

    window.fbAsyncInit = function fbAsyncInit() {
      resolve(window.FB);
    };

    if (existingScript) {
      existingScript.addEventListener("error", () => {
        reject(new Error("No se pudo cargar el SDK de Facebook."));
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = FACEBOOK_SDK_SRC;
    script.onerror = () => {
      reject(new Error("No se pudo cargar el SDK de Facebook."));
    };

    document.body.appendChild(script);
  });

  return sdkPromise;
}

export async function startWhatsAppBusinessEmbeddedSignup() {
  const config = assertMetaConfig();
  const FB = await loadFacebookSdk();
  const loginOptions = {
    config_id: config.configId,
    response_type: "code",
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: "whatsapp_business_app_onboarding",
      sessionInfoVersion: "3",
    },
  };

  FB.init({
    appId: config.appId,
    version: config.graphVersion,
    cookie: true,
    xfbml: true,
  });

  console.log("[WA Embedded Signup] Starting flow", {
    windowLocationHref: window.location.href,
    windowLocationOrigin: window.location.origin,
    windowLocationPathname: window.location.pathname,
    sendsExplicitRedirectUri: false,
    explicitRedirectUri: null,
    fallbackRedirectUri: null,
    expectedOauthRedirectUri: META_EMBEDDED_SIGNUP_REDIRECT_URI,
    configId: loginOptions.config_id,
    responseType: loginOptions.response_type,
    overrideDefaultResponseType: loginOptions.override_default_response_type,
    featureType: loginOptions.extras.featureType,
    sessionInfoVersion: loginOptions.extras.sessionInfoVersion,
  });

  return new Promise((resolve, reject) => {
    const codeRef = { current: null };
    const embeddedSignupRef = { current: null };
    const exchangeStartedRef = { current: false };
    const timeoutRef = { current: null };

    const handleEmbeddedSignupMessage = (event) => {
      const parsedMessage = parseEmbeddedSignupMessage(event);

      if (!parsedMessage) {
        return;
      }

      if (isEmbeddedSignupCompletion(parsedMessage)) {
        embeddedSignupRef.current = parsedMessage;
        ensureWaEmbeddedSignupDebug().lastEmbeddedSignup = parsedMessage;
        console.log("[WA Embedded Signup] completion event captured", embeddedSignupRef.current);
        maybeSendExchange();
        return;
      }

      if (parsedMessage.event === "CANCEL") {
        cleanupMessageListener();
        console.warn("[WA Embedded Signup] signup cancelled", parsedMessage);
        reject(new Error("El proceso de conexion fue cancelado antes de completarse."));
        return;
      }

      if (parsedMessage.event === "ERROR") {
        cleanupMessageListener();
        console.error("[WA Embedded Signup] signup error", parsedMessage);
        reject(new Error("Meta devolvio un error durante la conexion. Revisa la consola para mas detalle."));
      }
    };

    const cleanupMessageListener = () => {
      window.removeEventListener("message", handleEmbeddedSignupMessage);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const maybeSendExchange = () => {
      const code = codeRef.current;
      const embeddedSignup = embeddedSignupRef.current;

      console.log("[WA Embedded Signup] maybeSendExchange", {
        hasCode: Boolean(code),
        codeLength: code?.length ?? 0,
        hasEmbeddedSignup: Boolean(embeddedSignup),
        embeddedSignupType: embeddedSignup?.type ?? null,
        embeddedSignupEvent: embeddedSignup?.event ?? null,
        embeddedSignupVersion: embeddedSignup?.version ?? null,
        hasWabaId: Boolean(embeddedSignup?.waba_id || embeddedSignup?.data?.waba_id),
        hasPhoneNumberId: Boolean(
          embeddedSignup?.phone_number_id || embeddedSignup?.data?.phone_number_id
        ),
        hasBusinessId: Boolean(
          embeddedSignup?.business_id ||
          embeddedSignup?.data?.business_id ||
          embeddedSignup?.data?.businessId
        ),
        exchangeStarted: exchangeStartedRef.current,
      });

      if (exchangeStartedRef.current) {
        return;
      }

      if (!code) {
        return;
      }

      if (!isEmbeddedSignupCompletion(embeddedSignup)) {
        return;
      }

      exchangeStartedRef.current = true;
      cleanupMessageListener();
      console.log("[WA Embedded Signup] calling backend exchange");

      resolve({
        code,
        embeddedSignup,
      });
    };

    window.addEventListener("message", handleEmbeddedSignupMessage);

    FB.login(
      (response) => {
        const authResponse = response?.authResponse || null;
        const code = response?.authResponse?.code;

        console.log("[WA Embedded Signup] FB.login callback raw response", {
          status: response?.status || null,
          responseKeys: response ? Object.keys(response) : [],
          hasAuthResponse: Boolean(authResponse),
          authResponseKeys: authResponse ? Object.keys(authResponse) : [],
          hasCode: Boolean(code),
          codeLength: code ? String(code).length : 0,
          hasAccessToken: Boolean(authResponse?.accessToken),
          hasSignedRequest: Boolean(authResponse?.signedRequest),
          expiresIn: authResponse?.expiresIn || null,
          dataAccessExpirationTime:
            authResponse?.data_access_expiration_time || null,
          graphDomain: authResponse?.graphDomain || null,
        });

        if (!code) {
          cleanupMessageListener();
          reject(new Error("La conexión con Meta fue cancelada o no devolvió código."));
          return;
        }

        codeRef.current = code;
        ensureWaEmbeddedSignupDebug().lastCode = {
          hasCode: true,
          codeLength: String(code).length,
          timestamp: new Date().toISOString(),
        };

        console.log("[WA Embedded Signup] code captured", {
          hasCode: true,
          codeLength: String(code).length,
        });

        timeoutRef.current = window.setTimeout(() => {
          if (exchangeStartedRef.current) {
            return;
          }

          console.warn("[WA Embedded Signup] code received but completion postMessage missing", {
            debug: window.__waEmbeddedSignupDebug,
            note: "Check browser extensions/ad blockers. net::ERR_BLOCKED_BY_CLIENT may block Meta resources.",
          });

          cleanupMessageListener();
          reject(
            new Error(
              "Meta devolvio el codigo de autorizacion, pero no se recibio la informacion completa de Embedded Signup. Intenta nuevamente."
            )
          );
        }, 15000);

        maybeSendExchange();
      },
      loginOptions
    );
  });
}
