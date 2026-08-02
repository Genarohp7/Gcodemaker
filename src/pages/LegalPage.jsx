import { useEffect } from "react";

const CONTACT_EMAIL = "meta@gcodemaker.com.mx";
const CONTACT_WHATSAPP = "https://wa.me/525567359470";
const LAST_UPDATED = "2 de agosto de 2026";

const legalContent = {
  privacy: {
    title: "Aviso de privacidad",
    label: "Privacidad",
    intro:
      "Este aviso explica como GCodemaker trata la informacion relacionada con sus servicios digitales, GC Broadcast, GCodemaker Malu y los canales de contacto vinculados a clientes y usuarios.",
    sections: [
      {
        heading: "Responsable",
        paragraphs: [
          "GCodemaker es responsable del tratamiento de los datos personales recabados a traves de sus sitios, formularios, herramientas internas, integraciones de mensajeria, asistentes automatizados y canales de atencion.",
          "Para solicitudes relacionadas con privacidad o datos personales puedes escribir a meta@gcodemaker.com.mx.",
        ],
      },
      {
        heading: "Datos que podemos tratar",
        paragraphs: [
          "Segun la interaccion, podemos tratar numero de WhatsApp, nombre o informacion de perfil proporcionada por la plataforma cuando este disponible, contenido de mensajes, informacion comercial que el usuario proporcione voluntariamente y datos relacionados con una solicitud de servicio.",
          "Cuando el usuario solicita coordinar una cita, podemos tratar los datos necesarios para revisar disponibilidad y registrar la reunion. Tambien podemos conservar datos tecnicos y operativos necesarios para funcionamiento, seguridad y trazabilidad.",
          "En GC Broadcast podemos tratar datos de acceso, rol de usuario, permisos, informacion de campanas, destinatarios, mensajes enviados, estados de entrega, respuestas recibidas y archivos cargados por usuarios autorizados.",
        ],
      },
      {
        heading: "Finalidades",
        paragraphs: [
          "Usamos la informacion para responder solicitudes iniciadas por usuarios, ofrecer informacion sobre servicios de GCodemaker, perfilar necesidades comerciales, coordinar atencion humana, consultar disponibilidad y crear citas cuando el usuario lo solicite.",
          "Tambien usamos la informacion para operar GC Broadcast y otros servicios digitales, crear usuarios autorizados, asignar permisos, conectar lineas autorizadas, registrar historiales, medir consumo, atender soporte, prevenir uso indebido, mantener seguridad y mejorar la operacion del servicio.",
        ],
      },
      {
        heading: "Asistentes automatizados y atencion humana",
        paragraphs: [
          "Algunas conversaciones pueden ser atendidas inicialmente mediante un asistente automatizado como GCodemaker Malu. Malu puede responder dudas comerciales, recopilar contexto de una solicitud y facilitar la coordinacion con personal humano.",
          "Cuando el caso lo requiere, la atencion puede escalarse a una persona de GCodemaker para revisar detalles comerciales, tecnicos o de seguimiento.",
        ],
      },
      {
        heading: "Proveedores tecnologicos",
        paragraphs: [
          "Para operar nuestros servicios podemos utilizar proveedores tecnologicos como Meta y WhatsApp para mensajeria, OpenAI para procesamiento y generacion de respuestas, Google Calendar para consultar disponibilidad y crear citas cuando proceda, e infraestructura tecnologica utilizada por GCodemaker.",
          "Estos proveedores pueden procesar informacion necesaria para prestar sus servicios conforme a sus propias politicas. GCodemaker no vende datos personales y solo comparte informacion cuando es necesario para operar el servicio, cumplir instrucciones del cliente, atender requerimientos legales o mantener integraciones autorizadas.",
        ],
      },
      {
        heading: "Conservacion y seguridad",
        paragraphs: [
          "Conservamos la informacion durante el tiempo necesario para prestar el servicio, mantener historiales operativos, atender soporte, cumplir finalidades legales o de seguridad aplicables y resolver incidentes.",
          "Aplicamos medidas razonables de seguridad administrativa y tecnica para proteger la informacion contra acceso no autorizado, perdida, alteracion o uso indebido.",
        ],
      },
      {
        heading: "Solicitud de eliminacion de datos",
        paragraphs: [
          "Un usuario puede solicitar la eliminacion de la informacion relacionada con sus interacciones escribiendo a meta@gcodemaker.com.mx.",
          "Para localizar el registro, la solicitud debe incluir informacion suficiente, por ejemplo el numero de WhatsApp utilizado, nombre de la empresa si aplica y una descripcion clara de los datos relacionados. GCodemaker revisara la solicitud y la atendera conforme a obligaciones legales y operativas aplicables.",
        ],
      },
      {
        heading: "Derechos y contacto",
        paragraphs: [
          "Para ejercer derechos de acceso, rectificacion, cancelacion, oposicion o solicitar informacion sobre el tratamiento de datos, contactanos por correo o WhatsApp.",
          "Correo: meta@gcodemaker.com.mx. WhatsApp: +52 55 6735 9470.",
        ],
      },
    ],
  },
  terms: {
    title: "Terminos del servicio",
    label: "Terminos",
    intro:
      "Estos terminos regulan el uso de los servicios digitales operados por GCodemaker, incluyendo GC Broadcast cuando corresponda, GCodemaker Malu, herramientas de automatizacion, mensajeria y coordinacion comercial.",
    sections: [
      {
        heading: "Uso del servicio",
        paragraphs: [
          "Los servicios de GCodemaker pueden incluir paginas web, herramientas digitales, automatizaciones, mensajeria, asistentes comerciales, integraciones y coordinacion de citas.",
          "GC Broadcast permite administrar usuarios, lineas, campanas, consumo, envios de prueba, historiales y funciones relacionadas con mensajeria empresarial autorizada cuando el cliente utiliza ese servicio.",
          "El cliente y los usuarios deben usar los servicios de forma licita, mantener actualizada la informacion necesaria y asegurarse de contar con autorizacion para contactar a destinatarios cuando corresponda.",
        ],
      },
      {
        heading: "GCodemaker Malu",
        paragraphs: [
          "Malu es un asistente utilizado por GCodemaker para atender consultas, proporcionar informacion comercial, recopilar datos necesarios para entender una solicitud, facilitar la coordinacion con personal humano y gestionar disponibilidad o citas cuando corresponda.",
          "Las respuestas de Malu son de caracter comercial e informativo. Aspectos especificos de alcance, integraciones, tiempos, condiciones finales o decisiones tecnicas pueden requerir confirmacion humana.",
        ],
      },
      {
        heading: "Cuentas, accesos y datos de uso",
        paragraphs: [
          "Cuando un servicio requiere cuentas, el administrador del cliente puede crear usuarios, asignar contrasenas provisionales, definir roles, permisos y capacidad conforme al plan o configuracion contratada.",
          "Cada usuario debe proteger sus credenciales. Cualquier actividad realizada desde una cuenta autorizada se considerara realizada por el cliente o su personal.",
        ],
      },
      {
        heading: "Mensajeria y plataformas externas",
        paragraphs: [
          "Las funciones que usan WhatsApp, Meta, OpenAI, Google Calendar u otros proveedores externos dependen de su configuracion, aprobaciones, disponibilidad, politicas y limites tecnicos.",
          "GCodemaker puede asistir con la configuracion tecnica, pero no garantiza disponibilidad ininterrumpida de WhatsApp, Meta, OpenAI, Google Calendar, proveedores externos o infraestructura tecnologica.",
        ],
      },
      {
        heading: "Contenido y uso licito",
        paragraphs: [
          "El cliente es responsable del contenido de mensajes, bases de contactos, archivos, imagenes, documentos y cualquier informacion cargada, enviada o proporcionada a traves de los servicios.",
          "No deben utilizarse los servicios para spam, fraude, contenido enganoso, actividades ilegales, mensajes no autorizados, abuso de plataformas o comunicaciones que infrinjan derechos de terceros.",
        ],
      },
      {
        heading: "Planes, consumo y disponibilidad",
        paragraphs: [
          "Los planes, limites de mensajes, bloques adicionales, alcances y condiciones comerciales se acuerdan con cada cliente y pueden actualizarse conforme a la configuracion registrada.",
          "GCodemaker procura mantener sus servicios disponibles, pero pueden existir interrupciones por mantenimiento, cambios de proveedor, errores tecnicos, disponibilidad de plataformas externas o causas fuera de su control.",
        ],
      },
      {
        heading: "Propiedad intelectual",
        paragraphs: [
          "El software, marca, contenidos, disenos, configuraciones y materiales de GCodemaker estan protegidos por derechos de propiedad intelectual o industrial, salvo que se indique expresamente lo contrario.",
          "El uso de los servicios no transfiere derechos sobre la marca, tecnologia, codigo o materiales internos de GCodemaker.",
        ],
      },
      {
        heading: "Suspension o baja",
        paragraphs: [
          "GCodemaker puede suspender accesos o funciones si detecta uso indebido, incumplimiento de politicas, riesgo de seguridad, falta de pago o solicitud expresa del cliente administrador.",
          "El cliente puede solicitar la baja del servicio o eliminacion de datos conforme al aviso de privacidad publicado en este sitio.",
        ],
      },
      {
        heading: "Cambios y jurisdiccion",
        paragraphs: [
          "GCodemaker puede actualizar estos terminos cuando sea necesario para reflejar cambios operativos, legales, comerciales o tecnologicos.",
          "Estos terminos se interpretan conforme a las leyes aplicables en Mexico.",
        ],
      },
      {
        heading: "Contacto",
        paragraphs: [
          "Para soporte, solicitudes sobre datos, dudas comerciales o temas relacionados con los servicios digitales de GCodemaker, contacta a GCodemaker por correo o WhatsApp.",
          "Correo: meta@gcodemaker.com.mx. WhatsApp: +52 55 6735 9470.",
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
            Ultima actualizacion: {LAST_UPDATED}
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
              Para solicitudes de privacidad, soporte o terminos del servicio,
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
