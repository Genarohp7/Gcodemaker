const broadcastService = require("../services/broadcast-db.service");
const env = require("../config/env");
const whatsappService = require("../services/whatsapp.service");
const metaEmbeddedSignupService = require("../services/meta-embedded-signup.service");

async function getBroadcastOverview(req, res) {
  try {
    const overview = await broadcastService.getOverview();

    return res.status(200).json({
      ok: true,
      message: "Resumen de GC Broadcast",
      data: overview,
    });
  } catch (error) {
    console.error("Error al obtener resumen de GC Broadcast", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo obtener el resumen de GC Broadcast",
    });
  }
}

async function getBroadcastLines(req, res) {
  try {
    const lines = await broadcastService.getLines();

    return res.status(200).json({
      ok: true,
      message: "Lineas de GC Broadcast",
      data: lines,
    });
  } catch (error) {
    console.error("Error al obtener lineas de GC Broadcast", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudieron obtener las lineas de GC Broadcast",
    });
  }
}

async function getBroadcastUsers(req, res) {
  try {
    const users = await broadcastService.getUsers();

    return res.status(200).json({
      ok: true,
      message: "Usuarios de GC Broadcast",
      data: users,
    });
  } catch (error) {
    console.error("Error al obtener usuarios de GC Broadcast", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudieron obtener los usuarios de GC Broadcast",
    });
  }
}

async function getBroadcastAllowedTemplates(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const currentUser = await getCurrentSessionUser(session);
    const templates = await broadcastService.getAllowedTemplatesForUser({
      userId: currentUser?.id || session.sub,
      companyId: session.companyId || "cacp",
      role: session.role,
      whatsappConnectionId: currentUser?.whatsappConnectionId || session.whatsappConnectionId || null,
    });

    return res.status(200).json({
      ok: true,
      message: "Plantillas permitidas de GC Broadcast",
      data: templates,
    });
  } catch (error) {
    console.error("Error al obtener plantillas permitidas", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudieron obtener las plantillas permitidas",
    });
  }
}

async function assignCacpTemplatesToGabriela(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const result = await broadcastService.assignCacpTemplatesToGabriela();

    return res.status(result.ok ? 200 : 409).json({
      ok: result.ok,
      message: result.ok
        ? "Plantillas CACP asignadas a Gabriela"
        : "No se pudo completar la asignacion CACP",
      data: result,
    });
  } catch (error) {
    console.error("Error al asignar plantillas CACP a Gabriela", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo asignar la firma CACP",
    });
  }
}

async function loginBroadcastUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      message: "Usuario y contrasena son obligatorios",
      requiredFields: ["username", "password"],
    });
  }

  try {
    const session = await broadcastService.login({ username, password });

    return res.status(200).json({
      ok: true,
      message: "Sesion iniciada correctamente",
      data: session,
    });
  } catch (error) {
    console.error("Error al iniciar sesion en GC Broadcast", error);

    return res.status(401).json({
      ok: false,
      message: error.message || "No se pudo iniciar sesion",
    });
  }
}

async function createBroadcastUser(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const {
    name,
    phone,
    password,
    role,
    assignedMessages,
    menuAccess,
    whatsappConnectionId,
    whatsapp_connection_id,
  } = req.body;

  if (!name || !phone || !password || !role || !assignedMessages) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos obligatorios del usuario",
      requiredFields: ["name", "phone", "password", "role", "assignedMessages"],
    });
  }

  try {
    const user = await broadcastService.createUser({
      name,
      phone,
      password,
      role,
      assignedMessages,
      menuAccess: Array.isArray(menuAccess) ? menuAccess : [],
      whatsappConnectionId: whatsappConnectionId || whatsapp_connection_id || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Usuario local creado correctamente",
      data: user,
    });
  } catch (error) {
    console.error("Error al crear usuario de GC Broadcast", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudo crear el usuario",
    });
  }
}

async function updateBroadcastUserStatus(req, res) {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      ok: false,
      message: "El campo status es obligatorio",
    });
  }

  try {
    const user = await broadcastService.updateUserStatus({ userId, status });

    return res.status(200).json({
      ok: true,
      message: "Estado de usuario actualizado",
      data: user,
    });
  } catch (error) {
    console.error("Error al actualizar estado de usuario", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudo actualizar el estado del usuario",
    });
  }
}

async function updateBroadcastUserMessages(req, res) {
  const { userId } = req.params;
  const { assignedMessages } = req.body;

  if (!assignedMessages) {
    return res.status(400).json({
      ok: false,
      message: "El campo assignedMessages es obligatorio",
    });
  }

  try {
    const user = await broadcastService.updateUserMessages({
      userId,
      assignedMessages,
    });

    return res.status(200).json({
      ok: true,
      message: "Mensajes asignados actualizados",
      data: user,
    });
  } catch (error) {
    console.error("Error al actualizar mensajes asignados", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudieron actualizar los mensajes asignados",
    });
  }
}

async function updateBroadcastUserAccess(req, res) {
  const { userId } = req.params;
  const { menuAccess } = req.body;

  if (!Array.isArray(menuAccess)) {
    return res.status(400).json({
      ok: false,
      message: "El campo menuAccess debe ser una lista",
    });
  }

  try {
    const user = await broadcastService.updateUserAccess({ userId, menuAccess });

    return res.status(200).json({
      ok: true,
      message: "Accesos de usuario actualizados",
      data: user,
    });
  } catch (error) {
    console.error("Error al actualizar accesos de usuario", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudieron actualizar los accesos del usuario",
    });
  }
}

async function updateBroadcastCompanyPlan(req, res) {
  const {
    planLimit,
    operationalProtection,
    operationalCapacity,
    monthlyFee,
    extraBlockSize,
    extraBlockPrice,
  } = req.body;

  if (
    planLimit === undefined ||
    operationalProtection === undefined ||
    operationalCapacity === undefined ||
    monthlyFee === undefined ||
    extraBlockSize === undefined ||
    extraBlockPrice === undefined
  ) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos obligatorios del plan",
      requiredFields: [
        "planLimit",
        "operationalProtection",
        "operationalCapacity",
        "monthlyFee",
        "extraBlockSize",
        "extraBlockPrice",
      ],
    });
  }

  try {
    const company = await broadcastService.updateCompanyPlan({
      planLimit,
      operationalProtection,
      operationalCapacity,
      monthlyFee,
      extraBlockSize,
      extraBlockPrice,
    });

    return res.status(200).json({
      ok: true,
      message: "Plan de GC Broadcast actualizado",
      data: company,
    });
  } catch (error) {
    console.error("Error al actualizar plan de GC Broadcast", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudo actualizar el plan",
    });
  }
}

async function getBroadcastCampaigns(req, res) {
  try {
    const campaigns = await broadcastService.getCampaigns();

    return res.status(200).json({
      ok: true,
      message: "Campañas de GC Broadcast",
      data: campaigns,
    });
  } catch (error) {
    console.error("Error al obtener campañas de GC Broadcast", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudieron obtener las campañas de GC Broadcast",
    });
  }
}

async function getBroadcastCampaignDeliveryReports(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const currentUser =
      session.role === "admin_cliente" ? null : await getCurrentSessionUser(session);
    const reports = await broadcastService.getCampaignDeliveryReports({
      companyId: session.companyId || "cacp",
      responsibleUserId: session.role === "admin_cliente" ? null : session.sub,
      createdAfter: currentUser?.deliveryResultsResetAt || null,
    });

    return res.status(200).json({
      ok: true,
      message: "Resultados de entrega de GC Broadcast",
      data: reports,
    });
  } catch (error) {
    console.error("Error al obtener resultados de entrega", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: "No se pudieron obtener los resultados de entrega",
    });
  }
}

async function createBroadcastCampaign(req, res) {
  const { name, type, lineId, messageTemplate, recipients } = req.body;

  if (!name || !type || !lineId || !messageTemplate) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos obligatorios de la campaña",
      requiredFields: ["name", "type", "lineId", "messageTemplate"],
    });
  }

  try {
    const campaign = await broadcastService.createCampaign({
      name,
      type,
      lineId,
      messageTemplate,
      recipients: Array.isArray(recipients) ? recipients : [],
    });

    return res.status(201).json({
      ok: true,
      message: "Campaña preparada correctamente",
      data: campaign,
    });
  } catch (error) {
    console.error("Error al preparar campaña de GC Broadcast", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo preparar la campaña",
    });
  }
}

function normalizeCampaignRecipientPhone(recipient) {
  const rawPhone = String(recipient.telefono || recipient.phone || "").replace(/\D/g, "");

  if (rawPhone.length === 10) {
    return `52${rawPhone}`;
  }

  return rawPhone;
}

function normalizeInternationalPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function validateBienvenidaCursoPayload(payload) {
  const fields = [
    "phone",
    "nombreAlumno",
    "nombreCurso",
    "nombreTutora",
    "fechaInicio",
    "horaInicio",
  ];
  const errors = [];

  fields.forEach((field) => {
    if (!String(payload[field] || "").trim()) {
      errors.push(`${field} es requerido`);
    }
  });

  const phone = normalizeInternationalPhone(payload.phone);

  if (payload.phone && phone !== String(payload.phone).trim()) {
    errors.push("phone debe ir en formato internacional sin espacios, guiones ni +");
  }

  if (phone && !/^\d{11,15}$/.test(phone)) {
    errors.push("phone debe tener entre 11 y 15 digitos");
  }

  return {
    errors,
    phone,
  };
}

function getRecipientTemplateValue(recipient, names, fallback = "") {
  const value = names
    .map((name) => recipient[name])
    .find((candidate) => candidate !== undefined && candidate !== null && String(candidate).trim());

  return value === undefined || value === null ? fallback : String(value).trim();
}

function getBienvenidaCursoVariables(recipient, fallbackTutora = "") {
  return {
    nombreAlumno: getRecipientTemplateValue(recipient, [
      "nombreAlumno",
      "nombre_alumno",
      "nombre",
      "alumno",
    ]),
    nombreCurso: getRecipientTemplateValue(recipient, [
      "nombreCurso",
      "nombre_curso",
      "nombre_diplomado",
      "diplomado",
      "curso",
    ]),
    nombreTutora: getRecipientTemplateValue(
      recipient,
      ["nombreTutora", "nombre_tutora", "tutora"],
      fallbackTutora
    ),
    fechaInicio: getRecipientTemplateValue(recipient, [
      "fechaInicio",
      "fecha_inicio",
      "fecha",
    ]),
    horaInicio: getRecipientTemplateValue(recipient, ["horaInicio", "hora_inicio", "hora", "horario"]),
  };
}

function getSolicitudContactoVariables(recipient, fallbackTutora = "") {
  return {
    nombreAlumno: getRecipientTemplateValue(recipient, [
      "nombreAlumno",
      "nombre_alumno",
      "nombre",
      "alumno",
    ]),
    nombreTutora: getRecipientTemplateValue(
      recipient,
      ["nombreTutora", "nombre_tutora", "tutora"],
      fallbackTutora
    ),
  };
}

function getTemplateParametersFromMapping(recipient, variableMapping = [], fallbackTutora = "") {
  const safeMapping = Array.isArray(variableMapping) ? variableMapping : [];

  return safeMapping.map((variableName) => {
    const normalizedName = String(variableName || "").trim();
    const aliases = [normalizedName];

    if (normalizedName === "nombre_alumno") {
      aliases.push("nombreAlumno", "nombre", "alumno");
    }

    if (normalizedName === "nombre_curso") {
      aliases.push("nombreCurso", "nombre_diplomado", "diplomado", "curso");
    }

    if (normalizedName === "nombre_tutora") {
      aliases.push("nombreTutora", "tutora");
    }

    if (normalizedName === "fecha_inicio") {
      aliases.push("fechaInicio", "fecha");
    }

    if (normalizedName === "hora_inicio") {
      aliases.push("horaInicio", "hora", "horario");
    }

    return getRecipientTemplateValue(
      recipient,
      aliases,
      normalizedName === "nombre_tutora" ? fallbackTutora : ""
    );
  });
}

function getVariablesFromMapping(recipient, variableMapping = [], fallbackTutora = "") {
  return (Array.isArray(variableMapping) ? variableMapping : []).reduce((acc, variableName) => {
    acc[variableName] = getTemplateParametersFromMapping(
      recipient,
      [variableName],
      fallbackTutora
    )[0];
    return acc;
  }, {});
}

function validateTemplateParametersOrThrow({ templateName, templatePermission, parameters }) {
  const safeParameters = Array.isArray(parameters) ? parameters : [];
  const expectedCount = Number(templatePermission?.variableCount || 0);

  if (safeParameters.length !== expectedCount) {
    const error = new Error(
      `TEMPLATE_PARAMETER_COUNT_MISMATCH: ${templateName} requiere ${expectedCount} parametros y recibio ${safeParameters.length}`
    );
    error.code = "TEMPLATE_PARAMETER_COUNT_MISMATCH";
    throw error;
  }

  const emptyIndex = safeParameters.findIndex((value) => !String(value || "").trim());

  if (emptyIndex !== -1) {
    const error = new Error(
      `TEMPLATE_PARAMETER_EMPTY: parametro ${emptyIndex + 1} vacio para ${templateName}`
    );
    error.code = "TEMPLATE_PARAMETER_EMPTY";
    throw error;
  }
}

const OFFICIAL_CAMPAIGN_TEMPLATES = {
  solicitud_contacto: {
    templateName: "confirmacion_envio_info_acad_cacp",
    languageCode: "es_MX",
    variableMapping: ["nombre_alumno", "nombre_tutora"],
  },
  bienvenida: {
    templateName: "bienvenida_curso_cacp",
    languageCode: "es_MX",
    variableMapping: [
      "nombre_alumno",
      "nombre_curso",
      "nombre_tutora",
      "fecha_inicio",
      "hora_inicio",
    ],
  },
  calendario: {
    templateName: "calendario_clases_cacp",
    languageCode: "es_MX",
    variableMapping: [],
  },
  aviso_general: {
    templateName: "verificacion_datos_egreso_cacp",
    languageCode: "es_MX",
    variableMapping: [],
  },
};

function resolveOfficialCampaignTemplate({ type, templateName, languageCode, variableMapping }) {
  const officialTemplate = OFFICIAL_CAMPAIGN_TEMPLATES[type] || null;

  if (!officialTemplate) {
    return {
      templateName: templateName || null,
      languageCode: languageCode || null,
      variableMapping: Array.isArray(variableMapping) ? variableMapping : [],
      isOfficialTemplate: Boolean(templateName),
    };
  }

  return {
    templateName: templateName || officialTemplate.templateName,
    languageCode: languageCode || officialTemplate.languageCode,
    variableMapping: Array.isArray(variableMapping) && variableMapping.length
      ? variableMapping
      : officialTemplate.variableMapping,
    isOfficialTemplate: true,
  };
}

async function sendBienvenidaCursoTemplate(req, res) {
  const session = getSessionFromRequest(req);

  if (!session && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const validation = validateBienvenidaCursoPayload(req.body || {});

  if (validation.errors.length) {
    return res.status(400).json({
      ok: false,
      message: "Datos invalidos para plantilla bienvenida",
      errors: validation.errors,
    });
  }

  try {
    const result = await whatsappService.sendBienvenidaCursoTemplate({
      phone: validation.phone,
      nombreAlumno: req.body.nombreAlumno,
      nombreCurso: req.body.nombreCurso,
      nombreTutora: req.body.nombreTutora,
      fechaInicio: req.body.fechaInicio,
      horaInicio: req.body.horaInicio,
      phoneNumberId: req.body.phoneNumberId,
      connectionId: req.body.connectionId,
    });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      message: result.ok
        ? "Plantilla bienvenida enviada"
        : "Meta rechazo la plantilla bienvenida",
      data: {
        status: result.status,
        whatsappMessageId: result.whatsappMessageId,
        metaResponse: result.metaResponse,
        errorMessage: result.errorMessage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo enviar la plantilla bienvenida",
    });
  }
}

function renderCampaignMessage(template, recipient) {
  return String(template || "").replace(/\{\{([^}]+)\}\}/g, (_match, variableName) => {
    const normalizedName = String(variableName || "").trim();
    const candidates = [
      normalizedName,
      normalizedName.replaceAll("ñ", "n"),
      normalizedName.replaceAll("_inicio", ""),
    ];
    const value = candidates
      .map((candidate) => recipient[candidate])
      .find((candidateValue) => candidateValue !== undefined && candidateValue !== null);

    return value === undefined || value === null ? "" : String(value);
  });
}

async function sendBroadcastCampaign(req, res) {
  const session = getSessionFromRequest(req);

  if (!session && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const {
    name,
    type,
    connectionId,
    lineId,
    messageTemplate,
    templateName,
    languageCode,
    variableMapping,
    recipients,
    attachmentMode,
    generalAttachment,
  } = req.body;
  const safeRecipients = Array.isArray(recipients) ? recipients : [];
  const currentUser = session ? await getCurrentSessionUser(session) : null;
  const resolvedConnectionId =
    currentUser?.whatsappConnectionId || session?.whatsappConnectionId || connectionId;
  const resolvedTemplate = resolveOfficialCampaignTemplate({
    type,
    templateName,
    languageCode,
    variableMapping,
  });

  if (!name || !type || !messageTemplate || !safeRecipients.length) {
    return res.status(400).json({
      ok: false,
      message: "Faltan datos obligatorios para enviar la campana",
      requiredFields: ["name", "type", "messageTemplate", "recipients"],
    });
  }

  let templatePermission = null;

  if (resolvedTemplate.templateName) {
    try {
      templatePermission = await broadcastService.validateUserTemplateAssignment({
        userId: currentUser?.id || session?.sub,
        companyId: session?.companyId || "cacp",
        role: session?.role,
        whatsappConnectionId: resolvedConnectionId,
        templateName: resolvedTemplate.templateName,
        languageCode: resolvedTemplate.languageCode || "es_MX",
      });
    } catch (error) {
      return res.status(403).json({
        ok: false,
        message: error.message || "Plantilla no autorizada para este usuario",
      });
    }
  }

  let campaign;

  try {
    campaign = await broadcastService.createCampaign({
      name,
      type,
      lineId: lineId || null,
      whatsappConnectionId: resolvedConnectionId,
      messageTemplate,
      templateName: resolvedTemplate.templateName,
      languageCode: resolvedTemplate.languageCode,
      variableMapping: resolvedTemplate.variableMapping,
      recipients: safeRecipients.map((recipient) => ({
        ...recipient,
        phone: normalizeCampaignRecipientPhone(recipient),
      })),
      attachmentMode: generalAttachment ? "general" : attachmentMode || "none",
      responsibleUserId: session?.sub || null,
    });

    let uploadedMedia = null;

    if (generalAttachment?.base64) {
      uploadedMedia = await whatsappService.uploadMedia({
        connectionId: resolvedConnectionId,
        attachment: generalAttachment,
      });
    }

    const results = [];

    for (const recipient of safeRecipients) {
      const recipientPhone = normalizeCampaignRecipientPhone(recipient);
      const body = renderCampaignMessage(messageTemplate, recipient);

      try {
        let textResult;

        if (resolvedTemplate.templateName) {
          const templateParameters = getTemplateParametersFromMapping(
            recipient,
            resolvedTemplate.variableMapping,
            req.body.senderName || ""
          );
          const variables = getVariablesFromMapping(
            recipient,
            resolvedTemplate.variableMapping,
            req.body.senderName || ""
          );

          validateTemplateParametersOrThrow({
            templateName: resolvedTemplate.templateName,
            templatePermission,
            parameters: templateParameters,
          });

          textResult = await whatsappService.sendTemplateMessage({
            campaignId: campaign.id,
            recipientPhone,
            templateName: resolvedTemplate.templateName,
            languageCode: resolvedTemplate.languageCode || "es_MX",
            parameters: templateParameters,
            variables,
            connectionId: resolvedConnectionId,
          });
        } else {
          textResult = await whatsappService.sendTextMessage({
            recipientPhone,
            messageBody: body,
            connectionId: resolvedConnectionId,
          });
        }
        let attachmentResult = null;

        if (uploadedMedia?.mediaId) {
          attachmentResult = await whatsappService.sendMediaMessage({
            recipientPhone,
            connectionId: resolvedConnectionId,
            mediaId: uploadedMedia.mediaId,
            mediaKind: whatsappService.getMediaKind(generalAttachment.mimeType),
            filename: generalAttachment.name,
          });
        }

        const ok = textResult.ok && (!attachmentResult || attachmentResult.ok);
        const metaError =
          textResult.metaResponse?.error?.message ||
          attachmentResult?.metaResponse?.error?.message ||
          null;

        await broadcastService.updateCampaignRecipientResult({
          campaignId: campaign.id,
          phone: recipientPhone,
          status: ok ? "sent" : "failed",
          errorMessage: ok ? null : metaError || "Meta rechazo el envio",
        });

        results.push({
          phone: recipientPhone,
          status: ok ? "sent" : "failed",
          whatsappMessageId: textResult.whatsappMessageId,
          attachmentMessageId: attachmentResult?.whatsappMessageId || null,
          errorMessage: ok ? null : metaError || "Meta rechazo el envio",
        });
      } catch (error) {
        await broadcastService.updateCampaignRecipientResult({
          campaignId: campaign.id,
          phone: recipientPhone,
          status: "failed",
          errorMessage: error.message,
        });

        results.push({
          phone: recipientPhone,
          status: "failed",
          whatsappMessageId: null,
          attachmentMessageId: null,
          errorMessage: error.message,
        });
      }
    }

    const sentCount = results.filter((result) => result.status === "sent").length;
    const failedCount = results.length - sentCount;
    const finalStatus = failedCount === 0 ? "sent" : sentCount > 0 ? "partial" : "failed";

    await broadcastService.updateCampaignSendStatus({
      campaignId: campaign.id,
      status: finalStatus,
    });

    return res.status(200).json({
      ok: sentCount > 0,
      message:
        failedCount === 0
          ? "Campana enviada correctamente"
          : "Campana procesada con errores",
      data: {
        campaignId: campaign.id,
        status: finalStatus,
        sentCount,
        failedCount,
        total: results.length,
        results,
      },
    });
  } catch (error) {
    if (campaign?.id) {
      await broadcastService.updateCampaignSendStatus({
        campaignId: campaign.id,
        status: "failed",
      });
    }

    console.error("Error al enviar campana de GC Broadcast", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo enviar la campana",
    });
  }
}

function isInternalAdminRequest(req) {
  const adminKey = req.get("x-gc-broadcast-admin-key");

  return Boolean(env.gcBroadcastAdminKey && adminKey === env.gcBroadcastAdminKey);
}

function getAdminSessionFromRequest(req) {
  const authorization = req.get("authorization") || "";
  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  const session = broadcastService.verifySessionToken(token);

  return session?.role === "admin_cliente" ? session : null;
}

function getSessionFromRequest(req) {
  const authorization = req.get("authorization") || "";
  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return broadcastService.verifySessionToken(token);
}

function isAdminSessionRequest(req) {
  return Boolean(getAdminSessionFromRequest(req));
}

function getMetaExchangeRedirectTrace(redirectUri) {
  const mode = env.metaOauthRedirectUriMode || "none";

  if (mode === "app") {
    return {
      mode,
      redirectUriUsedByBackend: env.metaEmbeddedSignupRedirectUri,
      redirectUriSource: "env.GC_BROADCAST_META_REDIRECT_URI",
    };
  }

  if (mode === "fb_sdk_success") {
    return {
      mode,
      redirectUriUsedByBackend: "https://www.facebook.com/connect/login_success.html",
      redirectUriSource: "facebook_sdk_success_default",
    };
  }

  if (mode === "request") {
    return {
      mode,
      redirectUriUsedByBackend: redirectUri || env.metaEmbeddedSignupRedirectUri,
      redirectUriSource: redirectUri
        ? "request.body.redirectUri"
        : "env.GC_BROADCAST_META_REDIRECT_URI",
    };
  }

  return {
    mode,
    redirectUriUsedByBackend: null,
    redirectUriSource: "not_sent",
  };
}

function sanitizeMetaExchangeError(error) {
  const metaError = error?.metaResponse?.error;

  if (!metaError) {
    return null;
  }

  return {
    message: metaError.message || null,
    type: metaError.type || null,
    code: metaError.code || null,
    error_subcode: metaError.error_subcode || null,
    fbtrace_id: metaError.fbtrace_id || null,
  };
}

async function sendWhatsAppTestMessage(req, res) {
  if (!env.gcBroadcastAdminKey) {
    return res.status(503).json({
      ok: false,
      message: "Falta configurar GC_BROADCAST_ADMIN_KEY",
    });
  }

  if (!isInternalAdminRequest(req) && !isAdminSessionRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const {
    recipientPhone,
    to,
    messageBody,
    message,
    templateName,
    template_name,
    languageCode,
    language_code,
    phoneNumberId,
    lineId,
    connectionId,
  } = req.body;
  const resolvedRecipientPhone = String(recipientPhone || to || "").trim();
  const resolvedMessageBody = String(messageBody || message || "").trim();
  const resolvedTemplateName = String(templateName || template_name || "").trim();
  const resolvedLanguageCode = String(languageCode || language_code || "en_US").trim();
  const shouldSendTemplate = Boolean(resolvedTemplateName);

  if (!resolvedRecipientPhone || (!resolvedMessageBody && !shouldSendTemplate)) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos obligatorios para la prueba de WhatsApp",
      requiredFields: ["recipientPhone", "messageBody o templateName"],
    });
  }

  try {
    const result = shouldSendTemplate
      ? await whatsappService.sendTestTemplateMessage({
          recipientPhone: resolvedRecipientPhone,
          templateName: resolvedTemplateName,
          languageCode: resolvedLanguageCode,
          phoneNumberId,
          lineId,
          connectionId,
        })
      : await whatsappService.sendTestTextMessage({
          recipientPhone: resolvedRecipientPhone,
          messageBody: resolvedMessageBody,
          phoneNumberId,
          lineId,
          connectionId,
        });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      message: result.ok
        ? "Mensaje de prueba enviado a Meta"
        : "Meta rechazo el mensaje de prueba",
      data: {
        status: result.status,
        whatsappMessageId: result.storedMessage.whatsapp_message_id,
        storedMessageId: result.storedMessage.id,
        metaResponse: result.metaResponse,
      },
    });
  } catch (error) {
    const storedMessage = await whatsappService.saveFailedTestMessage({
      recipientPhone: resolvedRecipientPhone,
      messageBody: resolvedMessageBody || `template:${resolvedTemplateName}:${resolvedLanguageCode}`,
      phoneNumberId,
      error,
    });

    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo enviar el mensaje de prueba",
      data: {
        status: "failed",
        storedMessageId: storedMessage.id,
      },
    });
  }
}

async function createManualWhatsAppConnection(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const {
    lineName,
    line_name,
    displayPhoneNumber,
    display_phone_number,
    wabaId,
    waba_id,
    phoneNumberId,
    phone_number_id,
    accessToken,
    access_token,
  } = req.body;

  try {
    const connection = await broadcastService.createManualWhatsAppConnection({
      companyId: adminSession?.companyId || "cacp",
      lineName: lineName || line_name,
      displayPhoneNumber: displayPhoneNumber || display_phone_number,
      wabaId: wabaId || waba_id,
      phoneNumberId: phoneNumberId || phone_number_id,
      accessToken: accessToken || access_token,
    });

    return res.status(201).json({
      ok: true,
      message: "Conexion manual de WhatsApp Cloud API creada",
      data: connection,
    });
  } catch (error) {
    console.error("Error al crear conexion manual de WhatsApp", {
      message: error.message,
    });

    return res.status(400).json({
      ok: false,
      message: error.message || "No se pudo crear la conexion manual",
    });
  }
}

async function getWhatsAppInboundMessages(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const messages = await broadcastService.getWhatsAppInboundMessages({
      companyId: adminSession?.companyId || "cacp",
      limit: req.query.limit,
    });

    return res.status(200).json({
      ok: true,
      message: "Mensajes recibidos de WhatsApp",
      data: messages,
    });
  } catch (error) {
    console.error("Error al consultar mensajes recibidos de WhatsApp", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: "No se pudieron consultar los mensajes recibidos",
    });
  }
}

function getAuthenticatedSession(req) {
  const session = getSessionFromRequest(req);

  if (session) {
    return session;
  }

  return isInternalAdminRequest(req)
    ? { companyId: "cacp", role: "admin_cliente", sub: "internal" }
    : null;
}

async function getCurrentSessionUser(session) {
  if (!session?.sub || session.sub === "internal") {
    return null;
  }

  try {
    return await broadcastService.getUserById(session.sub);
  } catch {
    return null;
  }
}

async function getSessionPhoneNumberIdFilter(session) {
  if (!session || session.role === "admin_cliente") {
    return null;
  }

  const currentUser = await getCurrentSessionUser(session);
  const whatsappConnectionId =
    currentUser?.whatsappConnectionId || session.whatsappConnectionId;

  if (!whatsappConnectionId) {
    return null;
  }

  const connection = await broadcastService.getWhatsAppConnectionForSending({
    connectionId: whatsappConnectionId,
    companyId: session.companyId || "cacp",
  });

  return connection.phoneNumberId;
}

async function getWebChatConversations(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    const conversations = await broadcastService.getWebChatConversations(
      session.companyId || "cacp",
      await getSessionPhoneNumberIdFilter(session)
    );

    return res.status(200).json({
      ok: true,
      message: "Conversaciones de Web chat",
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudieron cargar las conversaciones",
    });
  }
}

async function getWebChatMessages(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    const messages = await broadcastService.getWebChatConversationMessages({
      conversationId: req.params.conversationId,
      companyId: session.companyId || "cacp",
      phoneNumberId: await getSessionPhoneNumberIdFilter(session),
    });

    return res.status(200).json({
      ok: true,
      message: "Mensajes de Web chat",
      data: messages,
    });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      message: error.message || "No se pudieron cargar los mensajes",
    });
  }
}

async function markWebChatConversationAsRead(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    const conversation = await broadcastService.markWebChatConversationAsRead({
      conversationId: req.params.conversationId,
      companyId: session.companyId || "cacp",
    });

    return res.status(200).json({
      ok: true,
      message: "Conversacion marcada como leida",
      data: conversation,
    });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      message: error.message || "No se pudo marcar como leida",
    });
  }
}

async function sendWebChatMessage(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  const content = String(req.body.content || "").trim();

  if (!content) {
    return res.status(400).json({
      ok: false,
      message: "El mensaje no puede estar vacio",
    });
  }

  try {
    const companyId = session.companyId || "cacp";
    const conversations = await broadcastService.getWebChatConversations(
      companyId,
      await getSessionPhoneNumberIdFilter(session)
    );
    const conversation = conversations.find((item) => item.id === req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        message: "Conversacion no encontrada",
      });
    }

    const currentUser = await getCurrentSessionUser(session);
    const whatsappConnectionId =
      currentUser?.whatsappConnectionId || session.whatsappConnectionId;
    const connection = whatsappConnectionId
      ? await broadcastService.getWhatsAppConnectionForSending({
          connectionId: whatsappConnectionId,
          companyId,
        })
      : conversation.phoneNumberId
      ? await broadcastService.getWhatsAppConnectionByPhoneNumberIdForSending({
          companyId,
          phoneNumberId: conversation.phoneNumberId,
        })
      : await broadcastService.getDefaultWhatsAppConnectionForSending({
          companyId,
        });
    const sendResult = await whatsappService.sendTextMessage({
      recipientPhone: conversation.phoneNumber,
      messageBody: content,
      connectionId: connection.id,
    });
    const storedMessage = await broadcastService.createWebChatMessage({
      conversationId: conversation.id,
      direction: "outgoing",
      type: "text",
      content,
      status: sendResult.ok ? "sent" : "failed",
      externalMessageId: sendResult.whatsappMessageId,
      rawPayload: sendResult.metaResponse,
    });

    return res.status(sendResult.ok ? 201 : 502).json({
      ok: sendResult.ok,
      message: sendResult.ok ? "Mensaje enviado" : "Meta rechazo el mensaje",
      data: storedMessage,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo enviar el mensaje",
    });
  }
}

async function uploadWebChatAttachment(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  return res.status(202).json({
    ok: true,
    message: "Adjuntos preparados para la siguiente fase de almacenamiento",
    data: {
      conversationId: req.params.conversationId,
      status: "pending_storage",
    },
  });
}

async function getWebChatMessageMedia(req, res) {
  const session = getAuthenticatedSession(req);

  if (!session) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    const message = await broadcastService.getWebChatMessageForMedia({
      messageId: req.params.messageId,
      companyId: session.companyId || "cacp",
    });
    const rawPayload = message.raw_payload || {};
    const rawMessage = rawPayload.message || {};
    const media =
      rawMessage.image ||
      rawMessage.document ||
      rawMessage.audio ||
      rawMessage.video ||
      null;

    if (!media?.id) {
      return res.status(404).json({
        ok: false,
        message: "El mensaje no tiene media disponible",
      });
    }

    const downloaded = await whatsappService.downloadMedia({
      mediaId: media.id,
      phoneNumberId: rawPayload.phoneNumberId,
    });
    const filename =
      rawMessage.document?.filename ||
      message.attachment_name ||
      `${message.id}`;

    res.setHeader("Content-Type", downloaded.mimeType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${String(filename).replaceAll('"', '')}"`
    );

    return res.status(200).send(downloaded.buffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo obtener el archivo",
    });
  }
}

async function verifyWhatsAppWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const isVerified = broadcastService.verifyWebhookToken({ mode, token });

  if (!isVerified) {
    return res.status(403).json({
      ok: false,
      message: "No se pudo verificar el webhook de WhatsApp",
    });
  }

  return res.status(200).send(challenge);
}

async function receiveWhatsAppWebhook(req, res) {
  try {
    await broadcastService.storeWebhookEvent(req.body);

    return res.status(200).json({
      ok: true,
      message: "Webhook recibido",
    });
  } catch (error) {
    console.error("Error al recibir webhook de WhatsApp", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo procesar el webhook",
    });
  }
}

async function exchangeEmbeddedSignupCode(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  const { code, redirectUri, lineId, embeddedSignup } = req.body;
  const resolvedCode = String(code || "").trim();
  const redirectTrace = getMetaExchangeRedirectTrace(redirectUri);
  const embeddedSignupData = embeddedSignup?.data || {};

  console.info("GC Broadcast Embedded Signup exchange request", {
    route: "POST /api/broadcast/meta/embedded-signup/exchange",
    graphVersion: env.metaGraphVersion,
    metaOauthRedirectUriMode: redirectTrace.mode,
    hasCode: Boolean(resolvedCode),
    redirectUriReceivedFromFrontend: redirectUri || null,
    redirectUriUsedByBackend: redirectTrace.redirectUriUsedByBackend,
    redirectUriSource: redirectTrace.redirectUriSource,
    hasEmbeddedSignup: Boolean(embeddedSignup),
    embeddedSignupType: embeddedSignup?.type || null,
    embeddedSignupEvent: embeddedSignup?.event || null,
    hasBusinessId: Boolean(embeddedSignupData.business_id),
    hasWabaId: Boolean(embeddedSignupData.waba_id),
    hasPhoneNumberId: Boolean(embeddedSignupData.phone_number_id),
  });

  if (!resolvedCode) {
    return res.status(400).json({
      ok: false,
      message: "El campo code es obligatorio",
      requiredFields: ["code"],
    });
  }

  if (embeddedSignup && embeddedSignup.type !== "WA_EMBEDDED_SIGNUP") {
    return res.status(400).json({
      ok: false,
      message: "La informacion de Embedded Signup no tiene el formato esperado",
      requiredFields: ["embeddedSignup"],
    });
  }

  try {
    const exchangeResult = await metaEmbeddedSignupService.exchangeEmbeddedSignupCode({
      code: resolvedCode,
      redirectUri,
      embeddedSignup,
    });

    const connection = await broadcastService.createWhatsAppConnection({
      companyId: adminSession?.companyId || "cacp",
      lineId: lineId || null,
      businessId: exchangeResult.businessId,
      wabaId: exchangeResult.wabaId,
      phoneNumberId: exchangeResult.phoneNumberId,
      connectedPhone: exchangeResult.connectedPhone,
      accessToken: exchangeResult.accessToken,
      tokenExpiration: exchangeResult.tokenExpiration,
      connectionStatus: exchangeResult.connectionStatus,
      rawResponse: exchangeResult.rawResponse,
    });

    return res.status(201).json({
      ok: true,
      message: "Conexion de WhatsApp recibida correctamente",
      data: connection,
    });
  } catch (error) {
    console.error("Error al intercambiar code de Embedded Signup", {
      message: error.message,
      status: error.status || null,
      metaErrorCode: error.metaResponse?.error?.code || null,
      metaError: sanitizeMetaExchangeError(error),
    });

    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "No se pudo completar la conexion con Meta",
      data: {
        connectionStatus: "failed",
        metaErrorCode: error.metaResponse?.error?.code || null,
      },
    });
  }
}

async function getWhatsAppConnections(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const connections = await broadcastService.getWhatsAppConnections(
      adminSession?.companyId || "cacp"
    );

    return res.status(200).json({
      ok: true,
      message: "Conexiones de WhatsApp",
      data: connections,
    });
  } catch (error) {
    console.error("Error al obtener conexiones de WhatsApp", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudieron obtener las conexiones de WhatsApp",
    });
  }
}

async function getWhatsAppConnectionMetaSummary(req, res) {
  const adminSession = getAdminSessionFromRequest(req);

  if (!adminSession && !isInternalAdminRequest(req)) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  try {
    const summary = await whatsappService.getConnectionMetaSummary({
      connectionId: req.params.connectionId,
    });

    return res.status(summary.ok ? 200 : 502).json({
      ok: summary.ok,
      message: summary.ok
        ? "Validacion de linea consultada en Meta"
        : "Meta rechazo la validacion de la linea",
      data: summary,
    });
  } catch (error) {
    console.error("Error al validar conexion de WhatsApp en Meta", {
      message: error.message,
    });

    return res.status(500).json({
      ok: false,
      message: error.message || "No se pudo validar la conexion en Meta",
    });
  }
}

module.exports = {
  getBroadcastOverview,
  getBroadcastLines,
  getBroadcastUsers,
  getBroadcastAllowedTemplates,
  assignCacpTemplatesToGabriela,
  loginBroadcastUser,
  createBroadcastUser,
  updateBroadcastUserStatus,
  updateBroadcastUserMessages,
  updateBroadcastUserAccess,
  updateBroadcastCompanyPlan,
  getBroadcastCampaigns,
  getBroadcastCampaignDeliveryReports,
  createBroadcastCampaign,
  sendBroadcastCampaign,
  sendBienvenidaCursoTemplate,
  sendWhatsAppTestMessage,
  createManualWhatsAppConnection,
  getWhatsAppInboundMessages,
  getWebChatConversations,
  getWebChatMessages,
  sendWebChatMessage,
  uploadWebChatAttachment,
  getWebChatMessageMedia,
  markWebChatConversationAsRead,
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
  exchangeEmbeddedSignupCode,
  getWhatsAppConnections,
  getWhatsAppConnectionMetaSummary,
};
