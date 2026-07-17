const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const broadcastDbService = require("./broadcast-db.service");

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function getMetaApiUrl(phoneNumberId) {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${phoneNumberId}/messages`;
}

function getMetaMediaApiUrl(phoneNumberId) {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${phoneNumberId}/media`;
}

function getMetaMediaInfoUrl(mediaId) {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${mediaId}`;
}

function getWabaPhoneNumbersUrl(wabaId) {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${wabaId}/phone_numbers`;
}

function getWabaMessageTemplatesUrl(wabaId) {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${wabaId}/message_templates`;
}

function getWhatsAppMessageId(metaResponse) {
  return metaResponse?.messages?.[0]?.id || null;
}

const BIENVENIDA_CURSO_TEMPLATE_NAME = "bienvenida_curso_cacp_v1";
const BIENVENIDA_CURSO_LANGUAGE = "es_MX";
const SOLICITUD_CONTACTO_TEMPLATE_NAME = "confirmacion_envio_info_academica";
const SOLICITUD_CONTACTO_LANGUAGE = "es_MX";

function assertWhatsAppConfig(phoneNumberId, accessToken = env.whatsappAccessToken) {
  if (!accessToken) {
    throw new Error("Falta configurar WHATSAPP_ACCESS_TOKEN");
  }

  if (!phoneNumberId) {
    throw new Error("Falta configurar WHATSAPP_PHONE_NUMBER_ID");
  }
}

async function resolveSendConfig({ phoneNumberId, connectionId }) {
  if (!connectionId) {
    return {
      phoneNumberId: phoneNumberId || env.whatsappPhoneNumberId,
      accessToken: env.whatsappAccessToken,
      connection: null,
    };
  }

  const connection = await broadcastDbService.getWhatsAppConnectionForSending({
    connectionId,
  });

  return {
    phoneNumberId: connection.phoneNumberId,
    accessToken: connection.accessToken,
    connection,
  };
}

async function saveTestMessage({
  recipientPhone,
  messageBody,
  phoneNumberId,
  metaResponse,
  whatsappMessageId,
  status,
}) {
  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_whatsapp_test_messages (
        id,
        recipient_phone,
        message_body,
        phone_number_id,
        meta_response,
        whatsapp_message_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      RETURNING *
    `,
    [
      createId("wa-test"),
      recipientPhone,
      messageBody,
      phoneNumberId,
      JSON.stringify(metaResponse || {}),
      whatsappMessageId || null,
      status,
    ]
  );

  return result.rows[0];
}

async function saveTemplateLog({
  campaignId = null,
  recipientPhone,
  templateName,
  variables,
  phoneNumberId,
  metaResponse,
  whatsappMessageId,
  status,
  errorMessage = null,
}) {
  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_whatsapp_template_logs (
        id,
        campaign_id,
        recipient_phone,
        template_name,
        variables,
        phone_number_id,
        meta_response,
        whatsapp_message_id,
        status,
        error_message
      )
      VALUES ($1, NULLIF($2, ''), $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9, $10)
      RETURNING *
    `,
    [
      createId("wa-template"),
      campaignId || null,
      recipientPhone,
      templateName,
      JSON.stringify(variables || {}),
      phoneNumberId,
      JSON.stringify(metaResponse || {}),
      whatsappMessageId || null,
      status,
      errorMessage,
    ]
  );

  return result.rows[0];
}

async function sendTestTextMessage({ recipientPhone, messageBody, phoneNumberId, connectionId }) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  const response = await fetch(getMetaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: {
        body: messageBody,
      },
    }),
  });

  const metaResponse = await response.json();
  const whatsappMessageId = getWhatsAppMessageId(metaResponse);
  const status = response.ok ? "submitted" : "failed";
  const storedMessage = await saveTestMessage({
    recipientPhone,
    messageBody,
    phoneNumberId: resolvedPhoneNumberId,
    metaResponse,
    whatsappMessageId,
    status,
  });

  return {
    ok: response.ok,
    status,
    storedMessage,
    metaResponse,
  };
}

async function sendTextMessage({ recipientPhone, messageBody, phoneNumberId, connectionId }) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  const response = await fetch(getMetaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: {
        body: messageBody,
      },
    }),
  });

  const metaResponse = await response.json();

  return {
    ok: response.ok,
    status: response.ok ? "submitted" : "failed",
    phoneNumberId: resolvedPhoneNumberId,
    whatsappMessageId: getWhatsAppMessageId(metaResponse),
    metaResponse,
  };
}

async function sendTemplateMessage({
  campaignId = null,
  recipientPhone,
  templateName,
  languageCode,
  parameters,
  variables,
  phoneNumberId,
  connectionId,
}) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;
  const safeParameters = Array.isArray(parameters) ? parameters : [];

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  const response = await fetch(getMetaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        ...(safeParameters.length
          ? {
              components: [
                {
                  type: "body",
                  parameters: safeParameters.map((text) => ({
                    type: "text",
                    text: String(text || ""),
                  })),
                },
              ],
            }
          : {}),
      },
    }),
  });
  const metaResponse = await response.json();
  const whatsappMessageId = getWhatsAppMessageId(metaResponse);
  const status = response.ok ? "submitted" : "failed";
  const errorMessage = response.ok
    ? null
    : metaResponse?.error?.message ||
      metaResponse?.error?.error_data?.details ||
      "Meta rechazo el template";
  const storedLog = await saveTemplateLog({
    campaignId,
    recipientPhone,
    templateName,
    variables,
    phoneNumberId: resolvedPhoneNumberId,
    metaResponse,
    whatsappMessageId,
    status,
    errorMessage,
  });

  return {
    ok: response.ok,
    status,
    phoneNumberId: resolvedPhoneNumberId,
    whatsappMessageId,
    metaResponse,
    storedLog,
    errorMessage,
  };
}

async function sendBienvenidaCursoTemplate({
  campaignId,
  phone,
  nombreAlumno,
  nombreCurso,
  nombreTutora,
  fechaInicio,
  horaInicio,
  phoneNumberId,
  connectionId,
}) {
  const variables = {
    nombreAlumno,
    nombreCurso,
    nombreTutora,
    fechaInicio,
    horaInicio,
  };

  return sendTemplateMessage({
    recipientPhone: phone,
    campaignId,
    templateName: BIENVENIDA_CURSO_TEMPLATE_NAME,
    languageCode: BIENVENIDA_CURSO_LANGUAGE,
    parameters: [nombreAlumno, nombreCurso, nombreTutora, fechaInicio, horaInicio],
    variables,
    phoneNumberId,
    connectionId,
  });
}

async function sendSolicitudContactoTemplate({
  campaignId,
  phone,
  nombreAlumno,
  nombreTutora,
  phoneNumberId,
  connectionId,
}) {
  const variables = {
    nombreAlumno,
    nombreTutora,
  };

  return sendTemplateMessage({
    recipientPhone: phone,
    campaignId,
    templateName: SOLICITUD_CONTACTO_TEMPLATE_NAME,
    languageCode: SOLICITUD_CONTACTO_LANGUAGE,
    parameters: [nombreAlumno, nombreTutora],
    variables,
    phoneNumberId,
    connectionId,
  });
}

function getMediaKind(mimeType) {
  if (String(mimeType || "").startsWith("image/")) {
    return "image";
  }

  return "document";
}

async function uploadMedia({ connectionId, phoneNumberId, attachment }) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  if (!attachment?.base64 || !attachment?.mimeType || !attachment?.name) {
    throw new Error("Adjunto invalido");
  }

  const fileBuffer = Buffer.from(attachment.base64, "base64");
  const formData = new FormData();
  const file = new Blob([fileBuffer], { type: attachment.mimeType });

  formData.append("messaging_product", "whatsapp");
  formData.append("file", file, attachment.name);

  const response = await fetch(getMetaMediaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
    },
    body: formData,
  });
  const metaResponse = await response.json();

  if (!response.ok || !metaResponse.id) {
    const metaMessage =
      metaResponse?.error?.message ||
      metaResponse?.error?.error_data?.details ||
      "No se pudo subir el adjunto a Meta";

    const error = new Error(metaMessage);
    error.metaResponse = metaResponse;
    throw error;
  }

  return {
    mediaId: metaResponse.id,
    phoneNumberId: resolvedPhoneNumberId,
    accessToken: sendConfig.accessToken,
    metaResponse,
  };
}

async function sendMediaMessage({
  recipientPhone,
  connectionId,
  phoneNumberId,
  mediaId,
  mediaKind,
  filename,
  caption,
}) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;
  const resolvedMediaKind = mediaKind || "document";
  const mediaPayload =
    resolvedMediaKind === "image"
      ? {
          id: mediaId,
          caption: caption || undefined,
        }
      : {
          id: mediaId,
          filename: filename || undefined,
          caption: caption || undefined,
        };

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  const response = await fetch(getMetaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: resolvedMediaKind,
      [resolvedMediaKind]: mediaPayload,
    }),
  });
  const metaResponse = await response.json();

  return {
    ok: response.ok,
    status: response.ok ? "submitted" : "failed",
    phoneNumberId: resolvedPhoneNumberId,
    whatsappMessageId: getWhatsAppMessageId(metaResponse),
    metaResponse,
  };
}

async function downloadMedia({ mediaId, phoneNumberId }) {
  if (!mediaId) {
    throw new Error("Media id requerido");
  }

  const connection = await broadcastDbService.getWhatsAppConnectionByPhoneNumberIdForSending({
    phoneNumberId,
  });
  const infoResponse = await fetch(getMetaMediaInfoUrl(mediaId), {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
    },
  });
  const mediaInfo = await infoResponse.json();

  if (!infoResponse.ok || !mediaInfo.url) {
    throw new Error(mediaInfo?.error?.message || "No se pudo obtener el media de Meta");
  }

  const fileResponse = await fetch(mediaInfo.url, {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
    },
  });

  if (!fileResponse.ok) {
    throw new Error("No se pudo descargar el archivo de Meta");
  }

  const arrayBuffer = await fileResponse.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: mediaInfo.mime_type || fileResponse.headers.get("content-type") || "application/octet-stream",
    fileSize: mediaInfo.file_size || null,
  };
}

async function getConnectionMetaSummary({ connectionId }) {
  const connection = await broadcastDbService.getWhatsAppConnectionForSending({
    connectionId,
  });

  if (!connection.wabaId) {
    throw new Error("La conexion no tiene WABA ID configurado");
  }

  const phoneNumbersResponse = await fetch(getWabaPhoneNumbersUrl(connection.wabaId), {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
    },
  });
  const phoneNumbersPayload = await phoneNumbersResponse.json();

  const templatesResponse = await fetch(getWabaMessageTemplatesUrl(connection.wabaId), {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
    },
  });
  const templatesPayload = await templatesResponse.json();
  const safeTemplates = Array.isArray(templatesPayload.data) ? templatesPayload.data : [];
  const syncedTemplates = templatesResponse.ok
    ? await broadcastDbService.syncWhatsAppConnectionTemplates({
        connectionId: connection.id,
        templates: safeTemplates,
      })
    : [];

  return {
    ok: phoneNumbersResponse.ok && templatesResponse.ok,
    connection: {
      id: connection.id,
      lineName: connection.lineName,
      wabaId: connection.wabaId,
      phoneNumberId: connection.phoneNumberId,
      displayPhoneNumber: connection.displayPhoneNumber,
      provider: connection.provider,
    },
    phoneNumbers: {
      ok: phoneNumbersResponse.ok,
      status: phoneNumbersResponse.status,
      data: Array.isArray(phoneNumbersPayload.data)
        ? phoneNumbersPayload.data.map((phoneNumber) => ({
            id: phoneNumber.id,
            display_phone_number: phoneNumber.display_phone_number,
            verified_name: phoneNumber.verified_name,
            quality_rating: phoneNumber.quality_rating,
          }))
        : [],
      error: phoneNumbersResponse.ok ? null : phoneNumbersPayload.error || null,
    },
    templates: {
      ok: templatesResponse.ok,
      status: templatesResponse.status,
      data: Array.isArray(templatesPayload.data)
        ? safeTemplates.map((template) => ({
            id: template.id,
            name: template.name,
            language: template.language,
            status: template.status,
            category: template.category,
            components: template.components || [],
          }))
        : [],
      syncedTemplates,
      error: templatesResponse.ok ? null : templatesPayload.error || null,
    },
  };
}

async function sendTestTemplateMessage({
  recipientPhone,
  templateName,
  languageCode,
  phoneNumberId,
  connectionId,
}) {
  const sendConfig = await resolveSendConfig({ phoneNumberId, connectionId });
  const resolvedPhoneNumberId = sendConfig.phoneNumberId;
  const resolvedTemplateName = templateName || "hello_world";
  const resolvedLanguageCode = languageCode || "en_US";
  const messageBody = `template:${resolvedTemplateName}:${resolvedLanguageCode}`;

  assertWhatsAppConfig(resolvedPhoneNumberId, sendConfig.accessToken);

  const response = await fetch(getMetaApiUrl(resolvedPhoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: resolvedTemplateName,
        language: {
          code: resolvedLanguageCode,
        },
      },
    }),
  });

  const metaResponse = await response.json();
  const whatsappMessageId = getWhatsAppMessageId(metaResponse);
  const status = response.ok ? "submitted" : "failed";
  const storedMessage = await saveTestMessage({
    recipientPhone,
    messageBody,
    phoneNumberId: resolvedPhoneNumberId,
    metaResponse,
    whatsappMessageId,
    status,
  });

  return {
    ok: response.ok,
    status,
    storedMessage,
    metaResponse,
  };
}

async function saveFailedTestMessage({ recipientPhone, messageBody, phoneNumberId, error }) {
  return saveTestMessage({
    recipientPhone,
    messageBody,
    phoneNumberId: phoneNumberId || env.whatsappPhoneNumberId || "not_configured",
    metaResponse: {
      error: error.message,
    },
    whatsappMessageId: null,
    status: "failed",
  });
}

module.exports = {
  sendTestTextMessage,
  sendTestTemplateMessage,
  sendTextMessage,
  sendTemplateMessage,
  sendBienvenidaCursoTemplate,
  sendSolicitudContactoTemplate,
  uploadMedia,
  sendMediaMessage,
  downloadMedia,
  getConnectionMetaSummary,
  getMediaKind,
  saveFailedTestMessage,
};
