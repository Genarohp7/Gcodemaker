const MALU_BUSINESS_KNOWLEDGE = Object.freeze({
  aiAgentPricingSource: Object.freeze({
    status: "AUTHORIZED_CURRENT_COMMERCIAL_SOURCE",
    note:
      "Estos precios son la fuente comercial vigente para Malu. No mezclar con importes historicos de docs/BILLING_MODEL.md.",
  }),
  aiAgentPackages: Object.freeze([
    Object.freeze({
      code: "ia_respuestas",
      name: "IA Respuestas",
      implementationPriceMxn: 1900,
      monthlyPriceMxn: 1900,
      infrastructure: "infraestructura compartida de GCodemaker",
      scope: Object.freeze([
        "respuestas automatizadas por WhatsApp",
        "preguntas frecuentes",
        "atencion inicial de prospectos",
        "operacion de un canal y una linea de WhatsApp",
      ]),
      limits: Object.freeze([
        "150 leads por ciclo",
        "1050 respuestas de IA por ciclo",
        "maximo siete respuestas de IA por lead",
        "30 minutos de audio por ciclo",
        "30 minutos de transcripcion por ciclo",
        "100 imagenes por ciclo",
        "1 hora de ajustes",
        "videollamada de 30 minutos",
        "sin citas por lead incluidas",
        "25 plantillas por ciclo",
      ]),
      recommendationCriteria: Object.freeze([
        "negocios que necesitan responder dudas frecuentes y no perder mensajes por tiempo de respuesta",
        "volumen moderado de conversaciones",
        "sin proceso comercial complejo ni agenda incluida",
      ]),
    }),
    Object.freeze({
      code: "ia_perfilador",
      name: "IA Perfilador",
      implementationPriceMxn: 4700,
      monthlyPriceMxn: 3900,
      infrastructure: "infraestructura compartida de GCodemaker",
      scope: Object.freeze([
        "perfilamiento de prospectos",
        "calificacion inicial de oportunidades",
        "recopilacion de contexto comercial",
        "una cita por lead cuando el flujo lo requiera",
      ]),
      limits: Object.freeze([
        "300 leads por ciclo",
        "3000 respuestas de IA por ciclo",
        "maximo diez respuestas de IA por lead",
        "90 minutos de audio por ciclo",
        "90 minutos de transcripcion por ciclo",
        "300 imagenes por ciclo",
        "2 horas de ajustes",
        "videollamada de 45 minutos",
        "1 cita por lead",
        "50 plantillas por ciclo",
      ]),
      recommendationCriteria: Object.freeze([
        "negocios que necesitan entender mejor a cada prospecto antes de transferirlo",
        "procesos donde la calificacion y la agenda aportan valor",
        "volumen mayor o mayor necesidad de contexto que IA Respuestas",
      ]),
    }),
    Object.freeze({
      code: "ia_comercial",
      name: "IA Comercial",
      implementationPriceMxn: 9800,
      monthlyPriceMxn: 6900,
      infrastructure: "infraestructura compartida de GCodemaker",
      scope: Object.freeze([
        "atencion comercial mas completa",
        "perfilamiento y seguimiento dentro del alcance autorizado",
        "calificacion de oportunidades",
        "apoyo a agenda comercial",
      ]),
      limits: Object.freeze([
        "500 leads por ciclo",
        "6000 respuestas de IA por ciclo",
        "maximo diez respuestas de IA por lead",
        "180 minutos de audio por ciclo",
        "180 minutos de transcripcion por ciclo",
        "600 imagenes por ciclo",
        "4 horas de ajustes",
        "videollamada de 60 minutos",
        "1 cita por lead",
        "100 plantillas por ciclo",
      ]),
      recommendationCriteria: Object.freeze([
        "negocios con mayor volumen o proceso comercial mas exigente",
        "casos donde se requiere mas capacidad mensual y mas ajustes",
        "operaciones que necesitan apoyo comercial mas amplio sin asumir infraestructura dedicada",
      ]),
    }),
  ]),
  products: Object.freeze([
    Object.freeze({
      code: "landing_esencial",
      name: "Landing Esencial",
      basePrice: "$2,500 MXN",
      billingType: "Pago por creacion de la landing base",
      mainMessage:
        "Tu negocio ya vende por WhatsApp. Ahora haz que tambien se vea profesional.",
      includes: Object.freeze([
        "landing page profesional",
        "dominio propio",
        "hosting",
        "dos correos empresariales",
        "hasta cuatro secciones",
        "boton directo de WhatsApp",
        "enlaces a redes sociales",
        "configuracion SEO inicial",
        "diseno adaptable a celular y computadora",
        "estructura orientada a generar confianza y facilitar contacto",
      ]),
      exampleSections: Object.freeze([
        "Inicio",
        "Nosotros",
        "Servicios o productos",
        "Contacto",
      ]),
      clientRequirements: Object.freeze([
        "nombre del negocio",
        "logotipo, cuando exista",
        "colores",
        "informacion de contacto",
        "servicios o productos",
        "fotografias",
        "redes sociales",
        "informacion comercial basica",
      ]),
      exclusions: Object.freeze([
        "tienda en linea",
        "pasarela de pago",
        "reservaciones complejas",
        "panel administrativo",
        "catalogo amplio",
        "software personalizado",
        "integraciones avanzadas",
        "SEO continuo",
        "campanas Google o Meta Ads",
        "fotografia profesional",
        "identidad de marca completa",
        "mantenimiento ilimitado",
      ]),
      guidance:
        "Cualquier ampliacion debe evaluarse y cotizarse aparte. Diferenciador autorizado: La IA puede ayudarte a crear una pagina; nosotros hacemos que funcione para tu negocio. No desacredites la inteligencia artificial.",
    }),
    Object.freeze({
      code: "agente_ia_base",
      name: "Agente de IA Base",
      basePrice: "$1,900 MXN mensuales",
      billingType: "Mensualidad publicitaria base",
      taxRule: "Agregar IVA cuando el cliente requiera factura.",
      advertisingMessage:
        "Por menos de $2,000 al mes puedes tener tu propio agente de IA.",
      objectives: Object.freeze([
        "responder mensajes",
        "atender prospectos",
        "resolver preguntas frecuentes",
        "calificar oportunidades",
        "reducir tiempos de respuesta",
        "evitar perder prospectos fuera del horario humano",
        "transferir conversaciones relevantes a una persona",
      ]),
      baseScope: Object.freeze([
        "aproximadamente 150 prospectos al mes",
        "hasta siete interacciones comerciales por prospecto",
        "operacion dentro de la ventana de atencion de 24 horas de WhatsApp",
        "configuracion sobre reglas y conocimiento previamente definidos",
      ]),
      exclusions: Object.freeze([
        "CRM completo",
        "campanas masivas",
        "ERP",
        "sistemas internos",
        "agenda compleja",
        "pagos",
        "cotizadores avanzados",
        "automatizacion administrativa compleja",
        "varias sucursales",
        "varios agentes especializados",
        "infraestructura dedicada",
        "API personalizada",
        "catalogos grandes",
        "entrenamiento ilimitado",
        "consumo ilimitado de IA",
        "soporte ilimitado",
        "Meta Ads",
        "costos de Meta o WhatsApp",
        "plantillas",
        "numeros telefonicos",
        "verificacion de Meta",
        "desbloqueo de cuentas",
        "costos de terceros",
        "integraciones personalizadas no autorizadas",
      ]),
      guidance:
        "Los elementos excluidos deben evaluarse y cotizarse aparte. Para agentes IA existen tres paquetes autorizados: IA Respuestas, IA Perfilador e IA Comercial. El limite de siete interacciones del paquete base es informacion comercial y no reemplaza limites tecnicos como AI_MAX_RESPONSES_PER_LEAD ni el maximo post-transferencia.",
    }),
  ]),
  personalizedSolutions: Object.freeze([
    "Soluciones en infraestructura compartida de GCodemaker",
    "Soluciones con infraestructura dedicada",
  ]),
  commercialConditions: Object.freeze([
    "Malu puede comunicar precios base autorizados.",
    "Las ampliaciones se cotizan aparte.",
    "Los descuentos requieren autorizacion.",
    "La implementacion personalizada puede tener costo separado.",
    "La mensualidad comienza al entrar en operacion comercial.",
    "No todo negocio requiere la misma solucion; primero se perfila y despues se recomienda.",
    "Cuando el cliente pregunte por precio de un paquete IA con implementacion definida, Malu puede mencionar una sola vez que al programar una llamada con el ingeniero responsable podria aplicar un descuento del 15% sobre el costo de implementacion.",
    "El 15% aplica solo sobre el costo de implementacion; no aplica sobre mensualidad, IVA, consumos, Meta, WhatsApp, infraestructura, servicios externos ni excedentes. Malu no calcula el descuento.",
  ]),
  pendingConfirmationTopics: Object.freeze({
    landing: Object.freeze([
      "duracion incluida del dominio y hosting",
      "renovacion anual",
      "numero de cambios",
      "tiempo de entrega",
      "mantenimiento",
      "secciones adicionales",
      "propiedad y entrega de archivos",
    ]),
    aiAgent: Object.freeze([
      "costo exacto de implementacion",
      "excedentes",
      "retencion definitiva de datos",
      "cancelacion",
      "permanencia",
      "integraciones incluidas",
      "costos de proveedores",
      "obligaciones concretas sobre Meta",
    ]),
  }),
  humanSchedule: Object.freeze({
    weekdays: "lunes a viernes 09:00 a 19:00",
    saturday: "sabado 09:00 a 17:00",
    sunday: "domingo cerrado",
    urgency: "urgencias pueden considerarse hasta las 22:00",
    callDuration: "una llamada puede proponerse con duracion aproximada de 30 minutos, sujeta a disponibilidad",
    caution: "no prometer disponibilidad inmediata sin confirmacion",
  }),
  profileTopics: Object.freeze([
    "nombre del prospecto",
    "nombre del negocio",
    "giro",
    "ubicacion",
    "que necesita resolver",
    "volumen aproximado de mensajes",
    "horarios de mayor saturacion",
    "objetivo comercial",
    "si busca web, agente IA o ambos",
    "herramientas actuales",
    "canales",
    "preguntas frecuentes",
    "citas o catalogo, cuando corresponda",
  ]),
});

function formatMxn(amount) {
  return `$${Number(amount).toLocaleString("es-MX")} MXN`;
}

function bulletList(items) {
  return items.map((item) => `  - ${item}`).join("\n");
}

function buildAiPackagePrompt(aiPackage) {
  return [
    `- ${aiPackage.name} (${aiPackage.code})`,
    `  Implementacion: ${formatMxn(aiPackage.implementationPriceMxn)}.`,
    `  Mensualidad: ${formatMxn(aiPackage.monthlyPriceMxn)}.`,
    `  Infraestructura: ${aiPackage.infrastructure}.`,
    "  Alcance:",
    bulletList(aiPackage.scope),
    "  Limites:",
    bulletList(aiPackage.limits),
    "  Criterios de recomendacion:",
    bulletList(aiPackage.recommendationCriteria),
  ].join("\n");
}

function buildProductPrompt(product) {
  const lines = [
    `- ${product.name} (${product.code})`,
    `  Precio base autorizado: ${product.basePrice}.`,
    `  Tipo de cobro: ${product.billingType}.`,
  ];

  if (product.mainMessage) {
    lines.push(`  Mensaje principal: ${product.mainMessage}`);
  }
  if (product.advertisingMessage) {
    lines.push(`  Mensaje publicitario autorizado: ${product.advertisingMessage}`);
  }
  if (product.taxRule) {
    lines.push(`  IVA: ${product.taxRule}`);
  }
  if (product.objectives) {
    lines.push("  Objetivo:");
    lines.push(bulletList(product.objectives));
  }
  if (product.includes) {
    lines.push("  Incluye:");
    lines.push(bulletList(product.includes));
  }
  if (product.baseScope) {
    lines.push("  Alcance base:");
    lines.push(bulletList(product.baseScope));
  }
  if (product.exampleSections) {
    lines.push(`  Ejemplos de secciones: ${product.exampleSections.join(", ")}.`);
  }
  if (product.clientRequirements) {
    lines.push(`  Requisitos del cliente: ${product.clientRequirements.join(", ")}.`);
  }
  if (product.exclusions) {
    lines.push("  No incluye automaticamente:");
    lines.push(bulletList(product.exclusions));
  }
  lines.push(`  Guia: ${product.guidance}`);

  return lines.join("\n");
}

function buildMaluBusinessKnowledgePrompt() {
  const products = MALU_BUSINESS_KNOWLEDGE.products.map(buildProductPrompt).join("\n\n");
  const aiPackages = MALU_BUSINESS_KNOWLEDGE.aiAgentPackages.map(buildAiPackagePrompt).join("\n\n");
  const pending = MALU_BUSINESS_KNOWLEDGE.pendingConfirmationTopics;

  return [
    "BUSINESS KNOWLEDGE AUTORIZADO DE GCODemaker:",
    "Usa esta informacion como unica fuente para productos, precios base, alcances, exclusiones y condiciones comerciales de Malu.",
    "",
    "Productos autorizados:",
    products,
    "",
    "Paquetes autorizados de Agentes de IA:",
    "No recomiendes un paquete automaticamente solo porque el usuario mencione WhatsApp, mensajes o IA. Primero perfila necesidad, volumen, proceso, integraciones, agenda y complejidad; despues recomienda el paquete que corresponda.",
    aiPackages,
    "Incentivo comercial aprobado para paquetes IA:",
    "  - Si el cliente pregunta por precio, costo, mensualidad, inversion, implementacion o presupuesto de un paquete IA con implementacion definida, puedes mencionar una sola vez: si programa una llamada con el ingeniero responsable podria aplicar un descuento del 15% sobre el costo de implementacion.",
    "  - No calcules el descuento. No lo presentes como garantizado. No lo apliques a mensualidad, IVA, consumos, Meta, WhatsApp, infraestructura, servicios externos ni excedentes.",
    "",
    "Soluciones personalizadas:",
    bulletList(MALU_BUSINESS_KNOWLEDGE.personalizedSolutions),
    "No asignes precio automatico a soluciones personalizadas. No uses referencias historicas como tarifas universales.",
    "",
    "Condiciones comerciales:",
    bulletList(MALU_BUSINESS_KNOWLEDGE.commercialConditions),
    "",
    "Temas pendientes de confirmacion por ingeniero:",
    `  - Landing: ${pending.landing.join(", ")}.`,
    `  - Agente IA: ${pending.aiAgent.join(", ")}.`,
    "",
    "Horario humano:",
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.weekdays}.`,
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.saturday}.`,
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.sunday}.`,
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.urgency}.`,
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.callDuration}.`,
    `  - ${MALU_BUSINESS_KNOWLEDGE.humanSchedule.caution}.`,
    "",
    "Temas de perfilamiento disponibles, sin convertirlos en formulario obligatorio:",
    bulletList(MALU_BUSINESS_KNOWLEDGE.profileTopics),
  ].join("\n");
}

module.exports = {
  MALU_BUSINESS_KNOWLEDGE,
  buildMaluBusinessKnowledgePrompt,
};
