---
name: n8n
description: >-
  Guía para diseñar, exportar e importar workflows de n8n. Cubre patrones de webhooks, nodos Postgres,
  manejo de errores, y buenas prácticas para flujos multi-tenant.
---

## Uso

Incluye `@n8n` al inicio de cualquier prompt relacionado con workflows de n8n.

## Conceptos clave

- n8n corre en el mismo VPS que AicoreLink, conectado a la misma instancia PostgreSQL compartida.
- Los workflows se exportan como JSON y se versionan en `n8n-workflows/`.
- Cada workflow debe ser **idempotente**: ejecutarlo múltiples veces no debe duplicar datos.

## Patrón típico: Webhook → Postgres → IF → HTTP Request → Postgres

1. **Webhook trigger**: recibe payload desde un route handler de Next.js o directo de Meta
2. **Postgres**: resolver tenant por `phone_number_id` / `page_id`
3. **IF**: verificar `tenant_channels.enabled = true` para el canal
4. **HTTP Request**: llamar a Ollama/OpenRouter para clasificación/respuesta
5. **HTTP Request**: enviar respuesta vía Meta Cloud API
6. **Postgres**: insertar en `messages` y actualizar `tenant_usage`

## Buenas prácticas

- Nunca hardcodear secrets en el JSON exportado; usar variables de entorno de n8n (`$env.VAR`)
- El webhook debe responder 200 a Meta **antes** de procesar (responder inmediatamente para evitar timeout)
- Los nodos Postgres deben respetar RLS ejecutando `SET LOCAL app.current_tenant = '{id}'`
- Agregar nodos IF para manejo de errores: si un paso falla, loguear y continuar (no dejar el webhook colgado)
- Usar `$json` y `$node` para referenciar outputs de nodos anteriores

## Estructura recomendada para export

```json
{
  "name": "aicorelink-whatsapp-text",
  "nodes": [...],
  "connections": {...},
  "settings": {
    "timezone": "America/Argentina/Buenos_Aires"
  }
}
```

## Import en Dokploy

1. Ir a n8n → **Workflows** → **Import from File**
2. Seleccionar el JSON desde `n8n-workflows/`
3. Configurar las credenciales (Postgres, Meta, etc.)
4. Activar el workflow
