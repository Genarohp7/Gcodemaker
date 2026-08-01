const env = require("../config/env");

function getGraphBaseUrl() {
  return `https://graph.facebook.com/${env.metaGraphVersion}`;
}

function getOauthRedirectUri(mode, redirectUri) {
  if (mode === "omit") {
    return null;
  }

  if (mode === "app") {
    return env.metaEmbeddedSignupRedirectUri;
  }

  if (mode === "fb_sdk_success") {
    return "https://www.facebook.com/connect/login_success.html";
  }

  if (mode === "request") {
    return redirectUri || env.metaEmbeddedSignupRedirectUri;
  }

  return null;
}

function sanitizeMetaErrorResponse(metaResponse) {
  if (!metaResponse || typeof metaResponse !== "object") {
    return metaResponse;
  }

  if (!metaResponse.error) {
    return { ok: true };
  }

  return {
    error: metaResponse.error,
  };
}

function assertMetaConfig() {
  if (!env.metaAppId) {
    throw new Error("Falta configurar META_APP_ID");
  }

  if (!env.metaAppSecret) {
    throw new Error("Falta configurar META_APP_SECRET");
  }
}

function getAccessTokenExpiration(tokenResponse) {
  const expiresIn = Number(tokenResponse?.expires_in);

  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { rawText: text };
  }
}

async function graphGet(path, accessToken) {
  const url = new URL(`${getGraphBaseUrl()}${path}`);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const body = await readJsonResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function getFirstArrayItem(value) {
  return Array.isArray(value?.data) && value.data.length ? value.data[0] : null;
}

function getArrayItems(value) {
  return Array.isArray(value?.data) ? value.data : [];
}

function getEmbeddedSignupAssets(embeddedSignup) {
  const data = embeddedSignup?.data || {};

  return {
    businessId: data.business_id || null,
    wabaId: data.waba_id || null,
    phoneNumberId: data.phone_number_id || null,
  };
}

function resolveAssets({
  tokenResponse,
  ownedWhatsAppAccounts,
  clientWhatsAppAccounts,
  phoneNumbers,
  embeddedSignup,
  businessId = null,
}) {
  const ownedWaba = getFirstArrayItem(ownedWhatsAppAccounts?.body);
  const clientWaba = getFirstArrayItem(clientWhatsAppAccounts?.body);
  const waba = ownedWaba || clientWaba || null;
  const phoneNumber = getFirstArrayItem(phoneNumbers?.body);
  const embeddedAssets = getEmbeddedSignupAssets(embeddedSignup);

  return {
    businessId: embeddedAssets.businessId || tokenResponse?.business_id || businessId || null,
    wabaId: embeddedAssets.wabaId || waba?.id || null,
    phoneNumberId: embeddedAssets.phoneNumberId || phoneNumber?.id || null,
    connectedPhone:
      phoneNumber?.display_phone_number ||
      phoneNumber?.verified_name ||
      null,
  };
}

async function discoverWhatsAppAssets(accessToken, tokenResponse, embeddedSignup = null) {
  const businessId = tokenResponse?.business_id || embeddedSignup?.data?.business_id;

  if (!businessId || !accessToken) {
    if (accessToken) {
      const businesses = await graphGet(
        "/me/businesses?fields=id,name&limit=10",
        accessToken
      );

      for (const business of getArrayItems(businesses.body)) {
        if (!business?.id) {
          continue;
        }

        const fields = "id,name";
        const ownedWhatsAppAccounts = await graphGet(
          `/${business.id}/owned_whatsapp_business_accounts?fields=${encodeURIComponent(fields)}`,
          accessToken
        );
        const clientWhatsAppAccounts = await graphGet(
          `/${business.id}/client_whatsapp_business_accounts?fields=${encodeURIComponent(fields)}`,
          accessToken
        );
        const wabaId =
          getFirstArrayItem(ownedWhatsAppAccounts.body)?.id ||
          getFirstArrayItem(clientWhatsAppAccounts.body)?.id ||
          null;
        const phoneNumbers = wabaId
          ? await graphGet(
              `/${wabaId}/phone_numbers?fields=${encodeURIComponent(
                "id,display_phone_number,verified_name"
              )}`,
              accessToken
            )
          : null;

        if (wabaId || getFirstArrayItem(phoneNumbers?.body)?.id) {
          return {
            ownedWhatsAppAccounts,
            clientWhatsAppAccounts,
            phoneNumbers,
            businesses,
            resolvedAssets: resolveAssets({
              tokenResponse,
              ownedWhatsAppAccounts,
              clientWhatsAppAccounts,
              phoneNumbers,
              embeddedSignup,
              businessId: business.id,
            }),
          };
        }
      }

      return {
        ownedWhatsAppAccounts: null,
        clientWhatsAppAccounts: null,
        phoneNumbers: null,
        businesses,
        resolvedAssets: resolveAssets({ tokenResponse, embeddedSignup }),
      };
    }

    return {
      ownedWhatsAppAccounts: null,
      clientWhatsAppAccounts: null,
      phoneNumbers: null,
      resolvedAssets: resolveAssets({ tokenResponse, embeddedSignup }),
    };
  }

  const fields = "id,name";
  const ownedWhatsAppAccounts = await graphGet(
    `/${businessId}/owned_whatsapp_business_accounts?fields=${encodeURIComponent(fields)}`,
    accessToken
  );
  const clientWhatsAppAccounts = await graphGet(
    `/${businessId}/client_whatsapp_business_accounts?fields=${encodeURIComponent(fields)}`,
    accessToken
  );

  const wabaId =
    getFirstArrayItem(ownedWhatsAppAccounts.body)?.id ||
    getFirstArrayItem(clientWhatsAppAccounts.body)?.id ||
    null;

  const phoneNumbers = wabaId
    ? await graphGet(
        `/${wabaId}/phone_numbers?fields=${encodeURIComponent(
          "id,display_phone_number,verified_name"
        )}`,
        accessToken
      )
    : null;

  return {
    ownedWhatsAppAccounts,
    clientWhatsAppAccounts,
    phoneNumbers,
    resolvedAssets: resolveAssets({
      tokenResponse,
      ownedWhatsAppAccounts,
      clientWhatsAppAccounts,
      phoneNumbers,
      embeddedSignup,
    }),
  };
}

async function exchangeEmbeddedSignupCode({ code, redirectUri, embeddedSignup = null }) {
  assertMetaConfig();

  const url = new URL(`${getGraphBaseUrl()}/oauth/access_token`);
  const redirectUriMode = env.metaOauthRedirectUriMode || "none";
  const resolvedRedirectUri = getOauthRedirectUri(redirectUriMode, redirectUri);

  url.searchParams.set("client_id", env.metaAppId);
  url.searchParams.set("client_secret", env.metaAppSecret);
  url.searchParams.set("code", code);

  if (resolvedRedirectUri) {
    url.searchParams.set("redirect_uri", resolvedRedirectUri);
  }

  const finalParamKeys = Array.from(url.searchParams.keys());
  const sendsRedirectUri = finalParamKeys.includes("redirect_uri");

  console.info("Meta Embedded Signup code exchange", {
    graphVersion: env.metaGraphVersion,
    metaOauthSendRedirectUriRaw: env.metaOauthSendRedirectUriRaw || null,
    redirectUriMode,
    sendsRedirectUri,
    bodyHasRedirectUri: Boolean(redirectUri),
    bodyRedirectUri: redirectUri || null,
    redirectUri: sendsRedirectUri ? resolvedRedirectUri : null,
    finalParamKeys: finalParamKeys.filter((key) => key !== "client_secret" && key !== "code"),
    metaEndpoint: `${url.origin}${url.pathname}`,
  });

  const response = await fetch(url);
  const tokenResponse = await readJsonResponse(response);

  console.info("Meta Embedded Signup code exchange response", {
    status: response.status,
    metaErrorResponse: sanitizeMetaErrorResponse(tokenResponse),
  });

  if (!response.ok || tokenResponse.error) {
    const error = new Error(
      tokenResponse.error?.message || "Meta rechazo el intercambio del code"
    );
    error.status = response.status;
    error.metaResponse = tokenResponse;
    throw error;
  }

  const accessToken = tokenResponse.access_token || null;
  const assetDiscovery = accessToken
    ? await discoverWhatsAppAssets(accessToken, tokenResponse, embeddedSignup)
    : {
        ownedWhatsAppAccounts: null,
        clientWhatsAppAccounts: null,
        phoneNumbers: null,
        resolvedAssets: resolveAssets({ tokenResponse, embeddedSignup }),
      };

  const { resolvedAssets } = assetDiscovery;
  const connectionStatus =
    resolvedAssets.wabaId && resolvedAssets.phoneNumberId
      ? "connected"
      : "pending_assets";

  return {
    businessId: resolvedAssets.businessId,
    wabaId: resolvedAssets.wabaId,
    phoneNumberId: resolvedAssets.phoneNumberId,
    connectedPhone: resolvedAssets.connectedPhone,
    accessToken,
    tokenExpiration: getAccessTokenExpiration(tokenResponse),
    connectionStatus,
    rawResponse: {
      tokenResponse,
      assetDiscovery,
      embeddedSignup,
    },
  };
}

module.exports = {
  exchangeEmbeddedSignupCode,
};
