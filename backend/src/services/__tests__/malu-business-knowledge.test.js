const assert = require("node:assert/strict");

const {
  MALU_BUSINESS_KNOWLEDGE,
  buildMaluBusinessKnowledgePrompt,
} = require("../../knowledge/malu-business-knowledge");

function testProductsAndPricesAreStructured() {
  const landing = MALU_BUSINESS_KNOWLEDGE.products.find(
    (product) => product.code === "landing_esencial"
  );
  const aiAgent = MALU_BUSINESS_KNOWLEDGE.products.find(
    (product) => product.code === "agente_ia_base"
  );

  assert.equal(landing.name, "Landing Esencial");
  assert.equal(landing.basePrice, "$2,500 MXN");
  assert.equal(landing.billingType, "Pago por creacion de la landing base");
  assert.ok(landing.includes.includes("dominio propio"));
  assert.ok(landing.includes.includes("hosting"));
  assert.ok(landing.includes.includes("dos correos empresariales"));
  assert.ok(landing.includes.includes("hasta cuatro secciones"));
  assert.ok(landing.exclusions.includes("tienda en linea"));
  assert.ok(landing.exclusions.includes("pasarela de pago"));
  assert.ok(landing.exclusions.includes("software personalizado"));

  assert.equal(aiAgent.name, "Agente de IA Base");
  assert.equal(aiAgent.basePrice, "$1,900 MXN mensuales");
  assert.match(aiAgent.taxRule, /IVA/);
  assert.ok(aiAgent.baseScope.includes("aproximadamente 150 prospectos al mes"));
  assert.ok(aiAgent.baseScope.includes("hasta siete interacciones comerciales por prospecto"));
  assert.ok(
    aiAgent.baseScope.includes("operacion dentro de la ventana de atencion de 24 horas de WhatsApp")
  );
  assert.ok(aiAgent.exclusions.includes("CRM completo"));
  assert.ok(aiAgent.exclusions.includes("campanas masivas"));
  assert.ok(aiAgent.exclusions.includes("costos de Meta o WhatsApp"));

  const packages = MALU_BUSINESS_KNOWLEDGE.aiAgentPackages;
  assert.equal(
    MALU_BUSINESS_KNOWLEDGE.aiAgentPricingSource.status,
    "AUTHORIZED_CURRENT_COMMERCIAL_SOURCE"
  );
  assert.equal(packages.length, 3);
  assert.deepEqual(
    packages.map((aiPackage) => aiPackage.name),
    ["IA Respuestas", "IA Perfilador", "IA Comercial"]
  );
  assert.deepEqual(
    packages.map((aiPackage) => aiPackage.implementationPriceMxn),
    [1900, 4700, 9800]
  );
  assert.deepEqual(
    packages.map((aiPackage) => aiPackage.monthlyPriceMxn),
    [1900, 3900, 6900]
  );
  assert.ok(packages[0].limits.includes("150 leads por ciclo"));
  assert.ok(packages[1].limits.includes("300 leads por ciclo"));
  assert.ok(packages[2].limits.includes("500 leads por ciclo"));
}

function testPromptIncludesAuthorizedKnowledgeAndExcludesHistoricalQuotes() {
  const prompt = buildMaluBusinessKnowledgePrompt();

  assert.match(prompt, /BUSINESS KNOWLEDGE AUTORIZADO DE GCODemaker/);
  assert.match(prompt, /Landing Esencial/);
  assert.match(prompt, /\$2,500 MXN/);
  assert.match(prompt, /Pago por creacion de la landing base/);
  assert.match(prompt, /Agente de IA Base/);
  assert.match(prompt, /\$1,900 MXN mensuales/);
  assert.match(prompt, /IA Respuestas/);
  assert.match(prompt, /implementacion: \$1,900 MXN/i);
  assert.match(prompt, /IA Perfilador/);
  assert.match(prompt, /\$3,900 MXN/);
  assert.match(prompt, /IA Comercial/);
  assert.match(prompt, /\$9,800 MXN/);
  assert.match(prompt, /descuento del 15% sobre el costo de implementacion/i);
  assert.match(prompt, /Agregar IVA cuando el cliente requiera factura/);
  assert.match(prompt, /aproximadamente 150 prospectos al mes/);
  assert.match(prompt, /hasta siete interacciones comerciales por prospecto/);
  assert.match(prompt, /no reemplaza limites tecnicos/i);
  assert.match(prompt, /CRM completo/);
  assert.match(prompt, /campanas masivas/);
  assert.match(prompt, /No asignes precio automatico a soluciones personalizadas/);
  assert.doesNotMatch(prompt, /\$12,000|\$13,000|\$1,200|\$4,000/);
}

function testProfileTopicsAndHumanScheduleAreAvailable() {
  const prompt = buildMaluBusinessKnowledgePrompt();

  assert.match(prompt, /nombre del prospecto/);
  assert.match(prompt, /nombre del negocio/);
  assert.match(prompt, /volumen aproximado de mensajes/);
  assert.match(prompt, /horarios de mayor saturacion/);
  assert.match(prompt, /lunes a viernes 09:00 a 19:00/);
  assert.match(prompt, /sabado 09:00 a 17:00/);
  assert.match(prompt, /domingo cerrado/);
  assert.match(prompt, /sujeta a disponibilidad/);
}

function main() {
  testProductsAndPricesAreStructured();
  testPromptIncludesAuthorizedKnowledgeAndExcludesHistoricalQuotes();
  testProfileTopicsAndHumanScheduleAreAvailable();
}

main();
