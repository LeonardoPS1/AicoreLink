# n8n Workflows (AicoreLink E3 Mensajeria/IA)

Versioned n8n workflow exports for the messaging/AI layer. Each JSON file under
`workflows/` is importable into n8n ("Import from File") and is parameterized
per tenant via environment variables and internal API calls.

## Available workflows

- `workflows/lead.json` - New landing lead notification.
- `workflows/respuesta.json` - Conversational AI response (Ollama + guardrails).
- `workflows/reserva.json` - Appointment booking confirmation.
- `workflows/recordatorio.json` - Daily appointment reminders.
- `workflows/resena.json` - Post-visit review request.
- `workflows/reporte.json` - Weekly summary report.

## Import

1. Open n8n -> Workflows -> Import from File.
2. Select the JSON file.
3. Configure credentials (Postgres, HTTP, Twilio/Meta as needed).
4. Set environment variables (see below).
5. Activate the workflow.

## Environment variables

- `NEXTAUTH_URL` - Base URL of the dashboard.
- `FACTORY_INTERNAL_API_KEY` - Key for `/api/internal/*` endpoints (sent as `x-internal-key`).
- `OLLAMA_URL` - Ollama base URL (default `http://ollama:11434`).
- `N8N_WEBHOOK_SECRET` - Shared secret used to sign callbacks to `/api/webhooks/n8n`.

## Authentication paths

- Workflows in `workflows/` call dashboard endpoints under `/api/internal/*`
  (e.g. `/api/internal/messages`, `/api/internal/usage`). These authenticate with
  `x-internal-key: $FACTORY_INTERNAL_API_KEY`. No HMAC signature is required.
- The separate callback endpoint `/api/webhooks/n8n` (n8n -> dashboard, used to
  persist AI classification) authenticates with the HMAC signature
  `x-n8n-signature` (signed with `N8N_WEBHOOK_SECRET`). This path is not used by
  the workflows in this folder.

## Multi-tenant notes

- Workflows are cloned per tenant by changing parameters only; business logic lives
  in the dashboard (`/api/internal/*`).
- `recordatorio.json` and `reporte.json` hardcode the `'default'` tenant for v1;
  parameterize the tenant list when cloning per tenant.
