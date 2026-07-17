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
- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`

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

## Produccion

El backend actual de produccion vive en la VM de Google Cloud. Antes de modificar produccion:

1. Respaldar base de datos si hay migraciones.
2. Verificar variables de entorno en la VM.
3. Ejecutar pruebas locales o en entorno controlado.
4. Reiniciar el proceso PM2 solo despues de validar.
