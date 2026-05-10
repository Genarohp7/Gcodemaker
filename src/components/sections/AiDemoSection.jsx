import { useMemo, useState } from "react";
import { motion as Motion } from "motion/react";
import {
  createDemoLead,
  getDemoLimitFromError,
  sendDemoMessage,
} from "../../lib/demoApi";
import { trackEvent } from "../../lib/analytics";

const WHATSAPP_TEXT =
  "Hola, quiero tener un asistente IA como el demo de GCodemaker en mi negocio.";
const WHATSAPP_BASE_URL = "https://wa.me/525522737432";

const INITIAL_LEAD_FORM = {
  name: "",
  phone: "",
  businessName: "",
  goal: "",
};

function AiDemoSection() {
  const [isDemoVisible, setIsDemoVisible] = useState(false);
  const [leadForm, setLeadForm] = useState(INITIAL_LEAD_FORM);
  const [lead, setLead] = useState(null);
  const [leadStatus, setLeadStatus] = useState("idle");
  const [leadError, setLeadError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Cuentalo como si fuera un cliente real. Puedo responder hasta 3 preguntas para mostrarte como se sentiria un asistente IA en tu negocio.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("idle");
  const [chatError, setChatError] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  const isLeadFormValid = useMemo(
    () =>
      leadForm.name.trim() &&
      leadForm.phone.trim() &&
      leadForm.businessName.trim() &&
      leadForm.goal.trim(),
    [leadForm]
  );

  const isChatLocked = !lead || limitReached || chatStatus === "sending";

  const whatsappHref = useMemo(() => {
    const userQuestions = messages
      .map((message, index) => ({ ...message, index }))
      .filter((message) => message.role === "user")
      .map((question) => {
        const answer = messages
          .slice(question.index + 1)
          .find((message) => message.role === "assistant");

        return {
          question: question.content,
          answer: answer?.content || "",
        };
      });

    const conversationSummary = userQuestions.length
      ? userQuestions
          .map((item, index) => {
            const shortAnswer =
              item.answer.length > 360
                ? `${item.answer.slice(0, 360).trim()}...`
                : item.answer;

            return `${index + 1}. Pregunta: ${item.question}\nRespuesta: ${shortAnswer}`;
          })
          .join("\n\n")
      : "El usuario aun no hizo preguntas en el demo.";

    const message = `${WHATSAPP_TEXT}

Datos del lead:
Nombre: ${leadForm.name.trim() || "No indicado"}
WhatsApp: ${leadForm.phone.trim() || "No indicado"}
Negocio: ${leadForm.businessName.trim() || "No indicado"}
Objetivo: ${leadForm.goal.trim() || "No indicado"}

Conversacion del demo:
${conversationSummary}`;

    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
  }, [leadForm, messages]);

  function handleLeadFieldChange(event) {
    const { name, value } = event.target;

    setLeadForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleShowDemoClick() {
    setIsDemoVisible(true);
    trackEvent("ai_demo_instructions_closed", {
      section: "ai_demo",
      cta_name: "cerrar_instrucciones_y_usar_demo",
    });
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();
    setLeadError("");
    setLeadStatus("submitting");

    try {
      const createdLead = await createDemoLead({
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        businessName: leadForm.businessName.trim(),
        goal: leadForm.goal.trim(),
      });

      setLead(createdLead);
      setLeadStatus("success");
      trackEvent("ai_demo_lead_created", {
        section: "ai_demo",
        business_name: leadForm.businessName.trim(),
      });
    } catch (error) {
      setLeadError(error.message);
      setLeadStatus("idle");
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || !lead?.id || limitReached) return;

    setChatInput("");
    setChatError("");
    setChatStatus("sending");
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const aiResponse = await sendDemoMessage({
        leadId: lead.id,
        message,
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            aiResponse.reply ||
            "Listo. Ya recibi tu pregunta, pero no pude mostrar la respuesta completa.",
        },
      ]);
      setQuestionCount(aiResponse.questionCount);
      setLimitReached(aiResponse.limitReached);
      setChatStatus("idle");

      trackEvent("ai_demo_question_sent", {
        section: "ai_demo",
        question_count: aiResponse.questionCount,
        limit_reached: aiResponse.limitReached,
      });
    } catch (error) {
      const limit = getDemoLimitFromError(error);

      if (limit) {
        setQuestionCount(limit.questionCount);
        setLimitReached(true);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: limit.message,
          },
        ]);
      } else {
        setChatError(error.message);
      }

      setChatStatus("idle");
    }
  }

  function handleWhatsAppClick() {
    trackEvent("whatsapp_click", {
      click_origin: "ai_demo_limit_cta",
      section: "ai_demo",
      cta_name: "tener_asistente_ia_en_mi_negocio",
    });
  }

  return (
    <section id="demo-ia" className="section ai-demo-section">
      <div className="section__container">
        <div className="ai-demo">
          <div className="ai-demo__intro">
            <p className="section__eyebrow">Demo IA</p>
            <h2 className="section__title">
              Descubre cómo un agente IA puede atender clientes desde tu página
            </h2>
            <p className="section__text">
              Este demo te muestra cómo una IA integrada a tu negocio puede
              responder dudas, entender lo que busca cada cliente, recopilar
              información útil y ayudarte a detectar oportunidades antes de que
              se pierdan.
            </p>
          </div>

          {!isDemoVisible ? (
            <Motion.div
              className="ai-demo__guide"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="ai-demo__guide-main">
                <div className="ai-demo__panel-heading">
                  <span className="ai-demo__step">?</span>
                  <div>
                    <h3 className="ai-demo__panel-title">
                      Antes de probar el demo
                    </h3>
                    <p className="ai-demo__panel-text">
                      No estás probando un chatbot genérico. Estás viendo una
                      simulación de un agente IA que puede adaptarse al contexto
                      de tu negocio: servicios, horarios, procesos, preguntas
                      frecuentes y forma de atender clientes.
                    </p>
                  </div>
                </div>

                <div className="ai-demo__guide-highlight">
                  <p>
                    Un agente IA puede ayudarte a filtrar prospectos, resolver
                    dudas repetitivas, guiar al cliente hacia el siguiente paso
                    y entregarte información más clara para vender mejor o dar
                    seguimiento.
                  </p>
                </div>

                <div className="ai-demo__guide-heading">
                  <h3 className="ai-demo__guide-title">Cómo usar este demo</h3>
                  <p className="ai-demo__guide-text">
                    Usa el demo pensando en tu propio negocio. Mientras más real
                    sea tu ejemplo, más claro será lo que una IA podría ayudarte
                    a simplificar.
                  </p>
                </div>

                <button
                  type="button"
                  className="button button--primary ai-demo__guide-action"
                  onClick={handleShowDemoClick}
                >
                  Muy bien, quiero probar el demo
                </button>
              </div>

              <div className="ai-demo__guide-steps">
                <div className="ai-demo__guide-content">
                  <div className="ai-demo__guide-item">
                    <span className="ai-demo__guide-label">1</span>
                    <div>
                      <h4>Cuéntanos el contexto de tu negocio</h4>
                      <p>
                        Escribe tu nombre, WhatsApp, negocio y qué te gustaría
                        que la IA ayudara a resolver.
                      </p>
                      <span>
                        Esto permite simular un caso real, no una conversación
                        vacía.
                      </span>
                    </div>
                  </div>

                  <div className="ai-demo__guide-item">
                    <span className="ai-demo__guide-label">2</span>
                    <div>
                      <h4>Haz hasta 3 preguntas reales</h4>
                      <p>
                        Pregunta por servicios, precios, disponibilidad,
                        procesos o dudas que recibiría tu negocio.
                      </p>
                    </div>
                  </div>

                  <div className="ai-demo__guide-item">
                    <span className="ai-demo__guide-label">3</span>
                    <div>
                      <h4>Observa cómo usa el contexto</h4>
                      <p>
                        Verás cómo podría atender, orientar y recopilar
                        información antes de que tú intervengas.
                      </p>
                    </div>
                  </div>

                  <div className="ai-demo__guide-item">
                    <span className="ai-demo__guide-label">4</span>
                    <div>
                      <h4>Contáctanos con más claridad</h4>
                      <p>
                        Nos llegará el contexto para decirte cómo GCodemaker
                        puede adaptar algo parecido a tu negocio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>
          ) : (
          <div className="ai-demo__grid">
            <form className="ai-demo__lead" onSubmit={handleLeadSubmit}>
              <div className="ai-demo__panel-heading">
                <span className="ai-demo__step">1</span>
                <div>
                  <h3 className="ai-demo__panel-title">Activa tu demo</h3>
                  <p className="ai-demo__panel-text">
                    El chat se desbloquea cuando registramos el lead.
                  </p>
                </div>
              </div>

              <label className="ai-demo__field">
                <span>Nombre</span>
                <input
                  type="text"
                  name="name"
                  value={leadForm.name}
                  onChange={handleLeadFieldChange}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  required
                  disabled={Boolean(lead)}
                />
              </label>

              <label className="ai-demo__field">
                <span>WhatsApp</span>
                <input
                  type="tel"
                  name="phone"
                  value={leadForm.phone}
                  onChange={handleLeadFieldChange}
                  placeholder="55 1234 5678"
                  autoComplete="tel"
                  required
                  disabled={Boolean(lead)}
                />
              </label>

              <label className="ai-demo__field">
                <span>Negocio</span>
                <input
                  type="text"
                  name="businessName"
                  value={leadForm.businessName}
                  onChange={handleLeadFieldChange}
                  placeholder="Nombre de tu negocio"
                  autoComplete="organization"
                  required
                  disabled={Boolean(lead)}
                />
              </label>

              <label className="ai-demo__field">
                <span>Objetivo</span>
                <textarea
                  name="goal"
                  value={leadForm.goal}
                  onChange={handleLeadFieldChange}
                  placeholder="Que quieres que haga tu asistente IA?"
                  rows="4"
                  required
                  disabled={Boolean(lead)}
                />
              </label>

              {leadError ? (
                <p className="ai-demo__error" role="alert">
                  {leadError}
                </p>
              ) : null}

              {lead ? (
                <p className="ai-demo__success">
                  Demo activo para {leadForm.businessName.trim()}.
                </p>
              ) : (
                <button
                  type="submit"
                  className="button button--primary ai-demo__submit"
                  disabled={!isLeadFormValid || leadStatus === "submitting"}
                >
                  {leadStatus === "submitting" ? "Activando..." : "Activar demo"}
                </button>
              )}
            </form>

            <div className="ai-demo__chat" aria-live="polite">
              <div className="ai-demo__panel-heading">
                <span className="ai-demo__step">2</span>
                <div>
                  <h3 className="ai-demo__panel-title">Haz tus preguntas</h3>
                  <p className="ai-demo__panel-text">
                    {questionCount}/3 preguntas usadas
                  </p>
                </div>
              </div>

              <div className="ai-demo__messages">
                {messages.map((message, index) => (
                  <div
                    className={`ai-demo__message ai-demo__message--${message.role}`}
                    key={`${message.role}-${index}`}
                  >
                    {message.content}
                  </div>
                ))}

                {chatStatus === "sending" ? (
                  <div className="ai-demo__message ai-demo__message--assistant">
                    Pensando la respuesta...
                  </div>
                ) : null}
              </div>

              {chatError ? (
                <p className="ai-demo__error" role="alert">
                  {chatError}
                </p>
              ) : null}

              {limitReached ? (
                <Motion.div
                  className="ai-demo__limit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="ai-demo__limit-title">
                    Te gustaria tener este asistente en tu negocio?
                  </h3>
                  <p className="ai-demo__limit-text">
                    Podemos convertir este demo en un asistente con tono,
                    preguntas frecuentes y objetivos comerciales de tu marca.
                  </p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="button button--primary"
                    onClick={handleWhatsAppClick}
                  >
                    Quiero mi asistente IA
                  </a>
                </Motion.div>
              ) : (
                <form className="ai-demo__composer" onSubmit={handleChatSubmit}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={
                      lead
                        ? "Escribe tu pregunta"
                        : "Activa el demo para escribir"
                    }
                    disabled={isChatLocked}
                  />
                  <button
                    type="submit"
                    className="button button--secondary"
                    disabled={isChatLocked || !chatInput.trim()}
                  >
                    Enviar
                  </button>
                </form>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AiDemoSection;
