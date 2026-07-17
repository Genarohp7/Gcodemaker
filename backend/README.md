# GCodemaker Backend

Backend Node/Express para el demo IA de GCodemaker y las rutas internas de broadcast/WhatsApp.

## Estructura

```text
src/
  app.js
  server.js
  config/
  controllers/
  db/
  routes/
  services/
```

## Variables de entorno

No subir `.env` al repositorio. Usa `.env.example` como referencia y coloca los valores reales solo en el entorno local o en la VM.

Variables principales:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
- `META_APP_ID`, `META_APP_SECRET`

## Comandos

```bash
npm install
npm run dev
npm start
npm run db:migrate
```

## Rutas base

- `GET /health`
- `POST /demo-leads`
- `POST /ai-demo`
- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`
- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`

Las rutas `/webhooks/whatsapp` son para el agente IA comercial. Las rutas
`/api/webhooks/whatsapp` pertenecen a GC Broadcast y se mantienen separadas.

## Modelo IA WhatsApp

La migracion `018_gc_ai_whatsapp_agent.sql` prepara tablas separadas para el agente comercial de WhatsApp:

- `gc_ai_users`
- `gc_ai_leads`
- `gc_ai_lead_profiles`
- `gc_ai_conversations`
- `gc_ai_messages`
- `gc_ai_usage_logs`
- `gc_ai_activity_logs`
- `gc_ai_settings`

Estas tablas no reemplazan `demo_leads` ni las tablas `gc_broadcast_*`; quedan listas para implementar el flujo de leads, conversaciones, modo demo, transferencia a humano y medicion de consumo IA.

## Webhook IA WhatsApp

El agente IA usa:

- `GET /webhooks/whatsapp` para la verificacion de Meta.
- `POST /webhooks/whatsapp` para recibir mensajes entrantes.

Por ahora el webhook guarda el lead, la conversacion, el mensaje entrante y una
respuesta fija en `gc_ai_messages`. La respuesta solo se envia a WhatsApp si
`WHATSAPP_AGENT_AUTO_REPLY_ENABLED=true` y existen las variables de Meta
necesarias. Esto evita respuestas reales accidentales durante pruebas o deploys
incompletos.

La decision inicial vive en `intent-guard.service.js`:

- saludos simples: respuesta fija sin OpenAI.
- preguntas fuera de tema: respuesta educada, estado `off_topic` y apagado IA.
- intencion comercial: transferencia a humano y estado `qualified_for_human`.
- poco contexto: una pregunta breve de perfilamiento.
- contexto util de negocio: perfilamiento con OpenAI, limitado por
  `AI_MAX_RESPONSES_PER_LEAD`.

La IA de perfilamiento vive en `ai-agent.service.js`. Usa `OPENAI_MODEL`,
respuestas cortas, guarda uso en `gc_ai_usage_logs` y actualiza resumen en
`gc_ai_lead_profiles`.

## Modo Demo WhatsApp

Los numeros autorizados se configuran en `ADMIN_WHATSAPP_NUMBERS` separados por
coma. Comandos disponibles desde WhatsApp:

- `/demo on 52155XXXXXXXX`
- `/demo off 52155XXXXXXXX`
- `/demo status 52155XXXXXXXX`

El demo usa `AI_MAX_DEMO_QUESTIONS` y `AI_DEMO_EXPIRATION_MINUTES`. Solo los
numeros admin pueden activar, apagar o consultar demos. Durante una demo, las
preguntas comerciales se responden como demostracion y consumen una pregunta en
lugar de transferirse inmediatamente a humano.

## Produccion

El backend actual de produccion vive en la VM de Google Cloud. Antes de modificar produccion:

1. Respaldar base de datos si hay migraciones.
2. Verificar variables de entorno en la VM.
3. Ejecutar pruebas locales o en entorno controlado.
4. Reiniciar el proceso PM2 solo despues de validar.
