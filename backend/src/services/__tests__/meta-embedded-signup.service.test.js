const assert = require("node:assert/strict");

const ENV_PATH = "../../config/env";
const SERVICE_PATH = "../meta-embedded-signup.service";
const REDIRECT_URI = "https://gcodemaker.com.mx/gc-broadcast/";
const APP_SECRET = "test-app-secret-not-logged";

function loadServiceWithEnv(overrides = {}) {
  const envKeys = [
    "META_APP_ID",
    "META_APP_SECRET",
    "META_GRAPH_VERSION",
    "GC_BROADCAST_META_REDIRECT_URI",
    "META_OAUTH_REDIRECT_URI_MODE",
    "META_OAUTH_SEND_REDIRECT_URI",
  ];

  for (const key of envKeys) {
    delete process.env[key];
  }

  Object.assign(process.env, {
    META_APP_ID: "test-app-id",
    META_APP_SECRET: APP_SECRET,
    META_GRAPH_VERSION: "v23.0",
    GC_BROADCAST_META_REDIRECT_URI: REDIRECT_URI,
    ...overrides,
  });

  delete require.cache[require.resolve(ENV_PATH)];
  delete require.cache[require.resolve(SERVICE_PATH)];

  return require(SERVICE_PATH);
}

async function testRedirectUriIsSentWhenConfigured() {
  const service = loadServiceWithEnv({
    META_OAUTH_REDIRECT_URI_MODE: "omit",
  });
  const capturedUrls = [];
  const capturedLogs = [];
  const originalFetch = global.fetch;
  const originalInfo = console.info;

  global.fetch = async (url) => {
    capturedUrls.push(String(url));

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          access_token: null,
          expires_in: 3600,
        });
      },
    };
  };

  console.info = (...args) => {
    capturedLogs.push(args);
  };

  try {
    await service.exchangeEmbeddedSignupCode({
      code: "test-authorization-code",
      embeddedSignup: null,
    });
  } finally {
    global.fetch = originalFetch;
    console.info = originalInfo;
  }

  assert.equal(capturedUrls.length, 1);

  const tokenUrl = new URL(capturedUrls[0]);
  assert.equal(tokenUrl.searchParams.get("client_id"), "test-app-id");
  assert.equal(tokenUrl.searchParams.get("client_secret"), APP_SECRET);
  assert.equal(tokenUrl.searchParams.get("code"), "test-authorization-code");
  assert.equal(tokenUrl.searchParams.get("redirect_uri"), REDIRECT_URI);

  const renderedLogs = JSON.stringify(capturedLogs);
  assert.match(renderedLogs, /redirect_uri/);
  assert.doesNotMatch(renderedLogs, new RegExp(APP_SECRET));
  assert.doesNotMatch(renderedLogs, /test-authorization-code/);
}

async function main() {
  await testRedirectUriIsSentWhenConfigured();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
