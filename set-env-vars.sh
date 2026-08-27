#!/bin/bash
ENCRYPTION_KEY=$(openssl rand -base64 32)
docker service update \
  --env-add AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434 \
  --env-add AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text \
  --env-add AICORELINK_ENCRYPTION_KEY=$ENCRYPTION_KEY \
  aicorelink-aicorelink-b7m7ol