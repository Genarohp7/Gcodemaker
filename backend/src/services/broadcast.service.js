const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");

const CACP_COMPANY = {
  id: "cacp",
  name: "Centro de Actualizacion y Capacitacion Profesional",
  alias: "CACP",
  planLimit: 1000,
  operationalProtection: 300,
  operationalCapacity: 1300,
  monthlyFee: 4500,
  extraBlockSize: 50,
  extraBlockPrice: 75,
};

const CACP_LINES = [];
const MENU_ACCESS_OPTIONS = [
  "dashboard",
  "users",
  "lines",
  "campaigns",
  "new",
  "history",
  "usage",
  "admin",
];

const CACP_USERS = [
  {
    id: "admin-cacp",
    companyId: "cacp",
    name: "Administrador CACP",
    phone: "Pendiente",
    hasPassword: true,
    role: "admin_cliente",
    assignedMessages: 1300,
    menuAccess: MENU_ACCESS_OPTIONS,
    status: "active",
  },
];

let localUsers = [...CACP_USERS];

const CACP_CAMPAIGNS = [];

async function getOverview() {
  return {
    company: CACP_COMPANY,
    lines: CACP_LINES,
    users: localUsers,
    usage: {
      period: "mock",
      used: 0,
      capacity: CACP_COMPANY.operationalCapacity,
      alerts: {
        warning: 80,
        critical: 95,
        exhausted: 100,
      },
    },
    backendStatus: "local_structure_ready",
  };
}

async function getLines() {
  return CACP_LINES;
}

async function getUsers() {
  return localUsers;
}

async function createUser({ name, phone, password, role, assignedMessages, menuAccess = [] }) {
  const normalizedPhone = String(phone).trim();
  const existingUser = localUsers.find((user) => user.phone === normalizedPhone);

  if (existingUser) {
    throw new Error("Ya existe un usuario local con ese telefono");
  }

  const allowedRoles = ["admin_cliente", "operador_cliente", "lectura_cliente"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Rol no valido para GC Broadcast");
  }

  const user = {
    id: `local-user-${Date.now()}`,
    companyId: "cacp",
    name: String(name).trim(),
    phone: normalizedPhone,
    hasPassword: Boolean(password),
    role,
    assignedMessages: validateAssignedMessages(assignedMessages),
    menuAccess: validateMenuAccess(menuAccess),
    status: "invitation_pending",
    lastAccess: "Sin acceso",
    accessMode: "local_mock",
  };

  localUsers = [...localUsers, user];

  return user;
}

function validateAssignedMessages(assignedMessages) {
  const numericAssignedMessages = Number(assignedMessages);
  const allowedMessageOptions = Array.from({ length: 10 }, (_, index) => (index + 1) * 100);

  if (!allowedMessageOptions.includes(numericAssignedMessages)) {
    throw new Error("La cantidad de mensajes asignados no es valida");
  }

  return numericAssignedMessages;
}

function validateMenuAccess(menuAccess) {
  return menuAccess.filter((menuId) => MENU_ACCESS_OPTIONS.includes(menuId));
}

async function updateUserStatus({ userId, status }) {
  const allowedStatuses = ["active", "invitation_pending", "suspended"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado no valido para el usuario");
  }

  const userIndex = localUsers.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  const updatedUser = {
    ...localUsers[userIndex],
    status,
  };

  localUsers = localUsers.map((user) => (user.id === userId ? updatedUser : user));

  return updatedUser;
}

async function updateUserMessages({ userId, assignedMessages }) {
  const userIndex = localUsers.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  const updatedUser = {
    ...localUsers[userIndex],
    assignedMessages: validateAssignedMessages(assignedMessages),
  };

  localUsers = localUsers.map((user) => (user.id === userId ? updatedUser : user));

  return updatedUser;
}

async function updateUserAccess({ userId, menuAccess }) {
  const userIndex = localUsers.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  const updatedUser = {
    ...localUsers[userIndex],
    menuAccess: validateMenuAccess(menuAccess),
  };

  localUsers = localUsers.map((user) => (user.id === userId ? updatedUser : user));

  return updatedUser;
}

async function getCampaigns() {
  return CACP_CAMPAIGNS;
}

async function createCampaign({ name, type, lineId, messageTemplate, recipients }) {
  return {
    id: "pending-db-campaign",
    companyId: "cacp",
    name,
    type,
    lineId,
    messageTemplate,
    recipientCount: recipients.length,
    status: "draft",
    persistence: "pending_database_migration",
  };
}

function verifyWebhookToken({ mode, token }) {
  return mode === "subscribe" && token && token === env.whatsappVerifyToken;
}

async function storeWebhookEvent(payload) {
  return {
    stored: false,
    reason: "pending_database_migration",
    receivedObject: payload?.object || null,
  };
}

module.exports = {
  getOverview,
  getLines,
  getUsers,
  createUser,
  updateUserStatus,
  updateUserMessages,
  updateUserAccess,
  getCampaigns,
  createCampaign,
  verifyWebhookToken,
  storeWebhookEvent,
};
