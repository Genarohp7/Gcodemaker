const demoService = require("../services/demo.service");

async function createDemoLead(req, res) {
  const { name, phone, businessName, goal } = req.body;

  if (!name || !phone || !businessName || !goal) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos obligatorios del lead",
      requiredFields: ["name", "phone", "businessName", "goal"],
    });
  }

  try {
    const lead = await demoService.createDemoLead({
      name,
      phone,
      businessName,
      goal,
    });

    return res.status(201).json({
      ok: true,
      message: "Lead del demo guardado correctamente",
      data: lead,
    });
  } catch (error) {
    console.error("Error al guardar el lead del demo", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo guardar el lead del demo",
    });
  }
}

async function handleAiDemo(req, res) {
  const { leadId, message } = req.body;

  if (!leadId) {
    return res.status(400).json({
      ok: false,
      message: "El campo leadId es obligatorio",
    });
  }

  if (!message) {
    return res.status(400).json({
      ok: false,
      message: "El campo message es obligatorio",
    });
  }

  try {
    const lead = await demoService.getDemoLeadById(leadId);

    if (!lead) {
      return res.status(404).json({
        ok: false,
        message: "Lead no encontrado",
      });
    }

    if (lead.question_count >= 3) {
      return res.status(403).json({
        ok: false,
        message: "Has alcanzado el limite de 3 preguntas del demo",
        data: {
          questionCount: lead.question_count,
          limitReached: true,
        },
      });
    }

    const aiResponse = await demoService.generateDemoResponse(message);
    const updatedLead = await demoService.incrementQuestionCount(leadId);

    return res.status(200).json({
      ok: true,
      message: "Respuesta generada correctamente",
      data: {
        reply: aiResponse,
        questionCount: updatedLead.question_count,
        limitReached: updatedLead.question_count >= 3,
      },
    });
  } catch (error) {
    console.error("Error al generar la respuesta del demo", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo generar la respuesta del demo",
    });
  }
}

module.exports = {
  createDemoLead,
  handleAiDemo,
};
