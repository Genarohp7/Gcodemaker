const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,

  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT) || 5432,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,

  openAiApiKey: process.env.OPENAI_API_KEY,

  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || "v23.0",
  gcBroadcastWebhookUrl: process.env.GC_BROADCAST_WEBHOOK_URL,
  gcBroadcastAdminKey: process.env.GC_BROADCAST_ADMIN_KEY,

  metaAppId: process.env.META_APP_ID,
  metaAppSecret: process.env.META_APP_SECRET,
  metaGraphVersion: process.env.META_GRAPH_VERSION || "v23.0",
  metaEmbeddedSignupRedirectUri:
    process.env.GC_BROADCAST_META_REDIRECT_URI ||
    "https://gcodemaker.com.mx/gc-broadcast",
  metaOauthSendRedirectUri:
    String(process.env.META_OAUTH_SEND_REDIRECT_URI || "false").toLowerCase() ===
    "true",
  metaOauthSendRedirectUriRaw: process.env.META_OAUTH_SEND_REDIRECT_URI,
  metaOauthRedirectUriMode:
    process.env.META_OAUTH_REDIRECT_URI_MODE ||
    (String(process.env.META_OAUTH_SEND_REDIRECT_URI || "false").toLowerCase() ===
    "true"
      ? "app"
      : "none"),
};

module.exports = env;
