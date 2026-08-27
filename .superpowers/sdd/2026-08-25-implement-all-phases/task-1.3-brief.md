#### Task 1.3: Add Required Env Vars to Dokploy
**Files:**
- Modify: Dokploy service environment variables (via UI or docker service update)

**Required vars for Fase 1:**
```
AICORELINK_META_CLOUD_API_TOKEN=<from Meta Developer Console>
AICORELINK_META_VERIFY_TOKEN=<random string, set in Meta webhook config>
AICORELINK_META_APP_SECRET=<from Meta Developer Console>
AICORELINK_OPENROUTER_API_KEY=<from openrouter.ai>
AICORELINK_OLLAMA_BASE_URL=http://172.18.0.1:11434
AICORELINK_N8N_WHATSAPP_WEBHOOK_URL=https://n8n.aicorebots.com/webhook/whatsapp-text
```

**Steps:**
- [ ] **Step 1: Get Meta credentials** from https://developers.facebook.com/apps/
- [ ] **Step 2: Get OpenRouter API key** from https://openrouter.ai/keys
- [ ] **Step 3: Update Dokploy service env vars** via `docker service update --env-add ...`
- [ ] **Step 4: Redeploy and verify** - Check service logs for successful startup