# Final Whole-Branch Review Fix Report (E3 Mensajería/IA)

## Commit
- `e8e5f7f` (see `git rev-parse HEAD`)

## Critical fixes
1. Chatwoot ingestion route now loads per-tenant config (`loadTenantWhatsAppConfig`), KB entries, forbidden topics (`KnowledgeBaseConfig`), tenant escalation keywords, and sends a guarded reply (`guardrailReply` + `applyGuardrails`/`applyForbiddenGuardrails`) instead of echoing the user message.
2. n8n `respuesta` workflow now calls AicoreLink `/api/internal/reply` (guarded KB reply) instead of Ollama directly; added `/api/internal/reply` endpoint.
3. Conversation identity unified: Meta-direct and n8n now use `conversationKey(tenantId, contactRef)` (`cw_` prefix); `conversationKey` guards missing ids.

## Important fixes
4. Fallback mirror path does a DB-level `findUnique` pre-check; documented cross-process limitation in `mirror.ts`.
5. `KnowledgeBase.tone`/`forbiddenTopics` marked `@deprecated`; `KnowledgeBaseConfig` is source of truth; documented.
6. Quota 80/100% operator notification hook point added (best-effort log + thread).

## Minor
7. `conversationKey` guards undefined/empty ids.
8. n8n workflow updated to AicoreLink endpoint.

## Verification
- Full test suite: 89 files / 688 tests passing.
- Typecheck: no errors in changed files.
