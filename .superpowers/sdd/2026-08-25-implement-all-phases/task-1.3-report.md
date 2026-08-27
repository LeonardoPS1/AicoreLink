# Task 1.3 Report: Add Required Env Vars to Dokploy

**Date:** 2026-08-26
**Service:** `aicorelink-aicorelink-b7m7ol` on VPS `51.222.207.250`
**Domain:** `https://AicoreLink.aicorebots.com`

---

## Summary

Added documentation and commands for setting Fase 1 environment variables on the Dokploy service. **Cannot execute directly** due to lack of SSH access to VPS and Dokploy API requiring web session auth.

---

## Current Env Vars (Already Set per Session Log)

| Variable | Status |
|----------|--------|
| `AICORELINK_DATABASE_URL` | ✅ Set |
| `AICORELINK_NEXTAUTH_SECRET` | ✅ Set |
| `AICORELINK_NEXTAUTH_URL` | ✅ Set (fixed to lowercase) |
| `NEXTAUTH_SECRET` | ✅ Set |
| `NEXTAUTH_URL` | ✅ Set |

---

## Env Vars to Add for Fase 1

### ✅ Can Set Now (Known Values)

```bash
# Ollama runs on VPS Docker host (172.18.0.1 is Docker gateway IP)
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434

# n8n webhook URL for WhatsApp text processing
AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text

# Encryption key for channel credentials (generate once)
AICORELINK_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### ⚠️ Require User Input (Meta Developer Console / OpenRouter)

| Variable | Source | Action Needed |
|----------|--------|---------------|
| `AICORELINK_META_CLOUD_API_TOKEN` | Meta Business App → Permanent Access Token | User must provide |
| `AICORELINK_META_VERIFY_TOKEN` | Random string (set same in Meta webhook config) | User generates + configures in Meta |
| `AICORELINK_META_APP_SECRET` | Meta Business App → Settings → Basic | User must provide |
| `AICORELINK_OPENROUTER_API_KEY` | https://openrouter.ai/keys | User must provide |

---

## Commands to Run on VPS (via SSH)

```bash
# 1. Generate encryption key (run once)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# 2. Add known env vars
docker service update \
  --env-add AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434 \
  --env-add AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text \
  --env-add AICORELINK_ENCRYPTION_KEY=$ENCRYPTION_KEY \
  aicorelink-aicorelink-b7m7ol

# 3. Add Meta credentials (replace PLACEHOLDERS with real values)
docker service update \
  --env-add AICORELINK_META_CLOUD_API_TOKEN=<YOUR_META_TOKEN> \
  --env-add AICORELINK_META_VERIFY_TOKEN=<YOUR_VERIFY_TOKEN> \
  --env-add AICORELINK_META_APP_SECRET=<YOUR_APP_SECRET> \
  aicorelink-aicorelink-b7m7ol

# 4. Add OpenRouter API key
docker service update \
  --env-add AICORELINK_OPENROUTER_API_KEY=<YOUR_OPENROUTER_KEY> \
  aicorelink-aicorelink-b7m7ol
```

**Alternative: Single command with all vars**
```bash
ENCRYPTION_KEY=$(openssl rand -base64 32)
docker service update \
  --env-add AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434 \
  --env-add AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text \
  --env-add AICORELINK_ENCRYPTION_KEY=$ENCRYPTION_KEY \
  --env-add AICORELINK_META_CLOUD_API_TOKEN=<YOUR_META_TOKEN> \
  --env-add AICORELINK_META_VERIFY_TOKEN=<YOUR_VERIFY_TOKEN> \
  --env-add AICORELINK_META_APP_SECRET=<YOUR_APP_SECRET> \
  --env-add AICORELINK_OPENROUTER_API_KEY=<YOUR_OPENROUTER_KEY> \
  aicorelink-aicorelink-b7m7ol
```

---

## Verification Steps

After running the commands:

```bash
# 1. Check service is updating/redeploying
docker service ps aicorelink-aicorelink-b7m7ol

# 2. Check logs for successful startup
docker service logs -f aicorelink-aicorelink-b7m7ol

# 3. Verify env vars are set
docker service inspect aicorelink-aicorelink-b7m7ol --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq -r '.[]' | grep AICORELINK
```

Expected log output on success:
- No Prisma connection errors
- Next.js compilation/startup messages
- Server listening on port 3000

---

## Files Created/Modified

| File | Description |
|------|-------------|
| `.superpowers/sdd/2026-08-25-implement-all-phases/task-1.3-report.md` | This report |
| `apps/dashboard/.env.example` | Already contains all Fase 1 vars as template (no changes needed) |

---

## Issues & Concerns

1. **No SSH Access**: Cannot execute commands directly. User must run via SSH or Dokploy UI.
2. **Dokploy API Auth**: Returns 401 - requires web session, not basic auth.
3. **Meta Credentials**: Must be obtained from https://developers.facebook.com/apps/
4. **OpenRouter Key**: Must be obtained from https://openrouter.ai/keys
5. **Verify Token**: Must match exactly what's configured in Meta Webhook settings
6. **Ollama Network**: `172.18.0.1` assumes Ollama runs on Docker host network. Verify with `docker network ls` on VPS.
7. **n8n Webhook**: Assumes n8n is at `https://n8n.aicorebots.com` with webhook path `/webhook/whatsapp-text`. Verify n8n deployment.

---

## Next Steps for User

1. **Get Meta credentials** from Facebook Developer Console
2. **Get OpenRouter API key** from openrouter.ai
3. **Generate verify token**: `openssl rand -hex 16` (save this, use in Meta webhook config)
4. **SSH to VPS** and run the docker service update commands above
5. **Verify deployment** via `docker service logs`
6. **Configure Meta webhook** with verify token and webhook URL: `https://AicoreLink.aicorebots.com/api/whatsapp/webhook`