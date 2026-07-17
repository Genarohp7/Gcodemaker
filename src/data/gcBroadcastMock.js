export const broadcastClient = {
  id: "cacp",
  name: "Centro de Actualizacion y Capacitacion Profesional",
  alias: "CACP",
  plan: 1000,
  protection: 300,
  totalCapacity: 1300,
  monthlyFee: "$4,500 MXN",
  extraBlockSize: 50,
  extraBlockPrice: "$75 MXN",
  used: 0,
  period: "Junio 2026",
};

export const broadcastLines = [];

export const broadcastUsers = [
  {
    id: "admin-cacp",
    name: "Administrador CACP",
    phone: "Pendiente",
    role: "Admin cliente",
    assignedMessages: 1300,
    menuAccess: [
      "dashboard",
      "users",
      "lines",
      "campaigns",
      "new",
      "history",
      "usage",
      "admin",
    ],
    status: "active",
    lastAccess: "Sin acceso",
  },
];

export const sampleRecipients = [
  {
    id: 1,
    nombre: "Erika Díaz Quiñones",
    telefono: "9611002233",
    usuario: "jperez",
    contrasena: "12345",
    diplomado: "ABORDAJE INMEDIATO EN CÓDIGO MARIPOSA EN DUELO GESTACIONAL",
    fecha_inicio: "04 DE AGOSTO 2026",
    horario: "Martes y jueves 19:00hrs a 21:00 hrs",
    grupo: "A",
    observaciones: "Confirmado",
    archivo_personalizado: "constancia-juan.pdf",
  },
  {
    id: 2,
    nombre: "Mariana Lopez",
    telefono: "9615557788",
    usuario: "mlopez",
    contrasena: "88421",
    diplomado: "Gestion Educativa",
    fecha_inicio: "10 julio 2026",
    horario: "Viernes 18:00 a 21:00",
    grupo: "B",
    observaciones: "Pendiente de pago",
    archivo_personalizado: "recibo-mariana.pdf",
  },
  {
    id: 3,
    nombre: "Carlos Ruiz",
    telefono: "9617779900",
    usuario: "cruiz",
    contrasena: "55120",
    diplomado: "Derecho Administrativo",
    fecha_inicio: "12 julio 2026",
    horario: "Domingos 10:00 a 14:00",
    grupo: "C",
    observaciones: "Requiere calendario",
    archivo_personalizado: "calendario-carlos.pdf",
  },
];

export const campaigns = [];

export const messageTemplate =
  "Hola {{nombre}}, te compartimos tus accesos al diplomado {{diplomado}}.\n\nUsuario: {{usuario}}\nContrasena: {{contrasena}}\n\nPor favor conserva esta informacion.\n\nAtentamente,\nCentro de Actualizacion y Capacitacion Profesional";

export const internalClients = [
  {
    client: "CACP",
    plan: "1,000 mensajes",
    protection: "300 mensajes",
    capacity: "1,300 mensajes",
    lines: 0,
    monthlyFee: "$4,500 MXN",
    extraBlock: "$75 por 50 mensajes",
    integrationStatus: "Preparacion visual",
    alerts: "Consumo normal",
    extraBlocks: 0,
    lastCampaign: "Sin campañas",
    paymentDate: "Pendiente de configurar",
    accountStatus: "Activo",
  },
];
