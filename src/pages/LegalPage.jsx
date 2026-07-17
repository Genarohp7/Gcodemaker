import { useEffect } from "react";

const CONTACT_EMAIL = "gehernandez@gcodemaker.com";
const CONTACT_WHATSAPP = "https://wa.me/525567359470";
const LAST_UPDATED = "2 de julio de 2026";

const legalContent = {
  privacy: {
    title: "Aviso de privacidad",
    label: "Privacidad",
    intro:
      "Este aviso explica cómo GCodemaker trata la información relacionada con GC Broadcast, nuestros servicios digitales y los canales de contacto vinculados a clientes y usuarios.",
    sections: [
      {
        heading: "Responsable",
        paragraphs: [
          "GCodemaker es responsable del tratamiento de los datos personales recabados a través de sus sitios, formularios, herramientas internas, integraciones de mensajería y canales de atención.",
          "GC Broadcast es una herramienta operada por GCodemaker para administrar envios, registros, usuarios, lineas de WhatsApp y actividad relacionada con campanas autorizadas por clientes.",
        ],
      },
      {
        heading: "Datos que podemos tratar",
        paragraphs: [
          "Podemos tratar nombre, teléfono, datos de acceso, rol de usuario, permisos, información de campañas, destinatarios, mensajes enviados, estados de entrega, respuestas recibidas y archivos cargados por usuarios autorizados.",
          "También podemos registrar datos técnicos necesarios para seguridad y operación, como fecha de acceso, actividad dentro de la herramienta, identificadores de mensajes, respuestas de plataformas integradas y eventos de sistema.",
        ],
      },
      {
        heading: "Finalidades",
        paragraphs: [
          "Usamos la información para operar GC Broadcast, crear usuarios, asignar permisos, conectar líneas autorizadas, enviar mensajes solicitados por el cliente, registrar historiales, medir consumo y atender solicitudes de soporte.",
          "Los datos también pueden utilizarse para cumplir obligaciones técnicas, prevenir uso indebido, mantener seguridad, resolver errores y mejorar la administración del servicio.",
        ],
      },
      {
        heading: "WhatsApp y terceros",
        paragraphs: [
          "Cuando un cliente conecta WhatsApp Cloud API o herramientas de Meta, ciertos datos pueden ser enviados o recibidos a través de plataformas de Meta conforme a sus propias condiciones y políticas.",
          "GCodemaker no vende datos personales. Solo comparte información cuando es necesario para operar el servicio, cumplir instrucciones del cliente, atender requerimientos legales o mantener integraciones autorizadas.",
        ],
      },
      {
        heading: "Conservacion y seguridad",
        paragraphs: [
          "Conservamos la información durante el tiempo necesario para prestar el servicio, mantener historiales operativos, atender soporte y cumplir obligaciones aplicables.",
          "Aplicamos medidas razonables de seguridad administrativa y técnica para proteger la información contra acceso no autorizado, pérdida, alteración o uso indebido.",
        ],
      },
      {
        heading: "Eliminacion de datos de usuario",
        paragraphs: [
          "Un usuario o cliente puede solicitar la eliminación, corrección o baja de sus datos escribiendo al correo de contacto indicado en esta página.",
          "La solicitud debe incluir el nombre de la empresa, el usuario o teléfono relacionado y una descripción clara de los datos que desea eliminar. GCodemaker revisará la solicitud y responderá por el mismo medio.",
        ],
      },
      {
        heading: "Derechos y contacto",
        paragraphs: [
          "Para ejercer derechos de acceso, rectificación, cancelación, oposición o solicitar información sobre el tratamiento de datos, contáctanos por correo o WhatsApp.",
          "Correo: gehernandez@gcodemaker.com. WhatsApp: +52 55 6735 9470.",
        ],
      },
    ],
  },
  terms: {
    title: "Términos del servicio",
    label: "Términos",
    intro:
      "Estos términos regulan el uso de GC Broadcast y los servicios digitales operados por GCodemaker para clientes que administran comunicación, usuarios y campañas.",
    sections: [
      {
        heading: "Uso del servicio",
        paragraphs: [
          "GC Broadcast permite administrar usuarios, líneas, campañas, consumo, envíos de prueba, historiales y funciones relacionadas con mensajería empresarial autorizada.",
          "El cliente es responsable de usar la herramienta de forma lícita, mantener actualizada la información de sus usuarios y asegurarse de contar con autorización para contactar a sus destinatarios.",
        ],
      },
      {
        heading: "Cuentas y accesos",
        paragraphs: [
          "El administrador del cliente puede crear usuarios, asignar contraseñas provisionales, definir roles, permisos y capacidad de mensajes conforme al plan contratado.",
          "Cada usuario debe proteger sus credenciales. Cualquier actividad realizada desde una cuenta autorizada se considerara realizada por el cliente o su personal.",
        ],
      },
      {
        heading: "Mensajeria y plataformas externas",
        paragraphs: [
          "Los envíos por WhatsApp dependen de la configuración, aprobaciones, disponibilidad, políticas y límites establecidos por Meta y WhatsApp Cloud API.",
          "GCodemaker puede asistir con la configuración técnica, pero el cliente debe respetar las reglas de mensajería, plantillas, consentimiento, calidad de número y políticas aplicables.",
        ],
      },
      {
        heading: "Contenido y datos cargados",
        paragraphs: [
          "El cliente es responsable del contenido de mensajes, bases de contactos, archivos, imágenes, documentos y cualquier información cargada o enviada desde GC Broadcast.",
          "No debe utilizarse la herramienta para spam, fraude, contenido engañoso, actividades ilegales, mensajes no autorizados o comunicaciones que infrinjan derechos de terceros.",
        ],
      },
      {
        heading: "Planes, consumo y disponibilidad",
        paragraphs: [
          "Los planes, límites de mensajes, bloques adicionales y condiciones comerciales se acuerdan con cada cliente y pueden actualizarse conforme a la configuración registrada.",
          "GCodemaker procura mantener el servicio disponible, pero pueden existir interrupciones por mantenimiento, cambios de proveedor, errores técnicos o disponibilidad de plataformas externas.",
        ],
      },
      {
        heading: "Suspension o baja",
        paragraphs: [
          "GCodemaker puede suspender accesos o funciones si detecta uso indebido, incumplimiento de políticas, riesgo de seguridad, falta de pago o solicitud expresa del cliente administrador.",
          "El cliente puede solicitar la baja del servicio o eliminación de datos conforme al aviso de privacidad publicado en este sitio.",
        ],
      },
      {
        heading: "Contacto",
        paragraphs: [
          "Para soporte, solicitudes sobre datos, dudas comerciales o temas relacionados con GC Broadcast, contacta a GCodemaker por correo o WhatsApp.",
          "Correo: gehernandez@gcodemaker.com. WhatsApp: +52 55 6735 9470.",
        ],
      },
    ],
  },
};

function LegalPage({ type }) {
  const content = legalContent[type] || legalContent.privacy;

  useEffect(() => {
    document.title = `${content.title} | GCodemaker`;
  }, [content.title]);

  return (
    <section className="legal-page" aria-labelledby="legal-title">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <p className="legal-page__label">{content.label}</p>
          <h1 id="legal-title" className="legal-page__title">
            {content.title}
          </h1>
          <p className="legal-page__intro">{content.intro}</p>
          <p className="legal-page__updated">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>

        <div className="legal-page__content">
          {content.sections.map((section) => (
            <article className="legal-page__section" key={section.heading}>
              <h2 className="legal-page__section-title">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p className="legal-page__text" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <div className="legal-page__contact">
          <div>
            <h2 className="legal-page__contact-title">Contacto directo</h2>
            <p className="legal-page__text">
              Para solicitudes de privacidad, soporte o términos del servicio,
              usa cualquiera de estos canales.
            </p>
          </div>
          <div className="legal-page__actions">
            <a className="button button--primary" href={`mailto:${CONTACT_EMAIL}`}>
              Escribir por correo
            </a>
            <a
              className="button button--secondary"
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LegalPage;
