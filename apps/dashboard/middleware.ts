// Rate limiting middleware for AicoreLink
// 
// NOTA: Next.js App Router tiene su propio sistema de middleware.
// Para rate limiting real, configurar @upstash/ratelimit con Redis en los API routes
// o usar middleware de nivel de infraigura (Dokploy/Traefik).
//
// Este archivo se mantiene para exportar configuraciones y tipos que pueden
// ser utilizados por los API routes individualmente.

/**
 * Configuración de rate limiting para usar en API routes.
 * Cuando Redis @upstash/ratelimit esté disponible:
 *   const ratelimit = new RateLimiterRedis({ redis, ... })
 *   export const GET = async (req) => { const result = await ratelimit.limit(ip); ... }
 *
 * Para development sin Redis, usar generalLimiter en los API routes con express o
 * confiar en las cabeceras de seguridad HTTP already configuradas en next.config.mjs.
 */

/** Limite general de API: 100 requests por IP por minuto */
export const generalLimiter = {
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again after 60 seconds.",
};

/** Rate limiter más estricto para endpoints de tenant */
export const tenantLimiter = {
  windowMs: 60 * 1000,
  max: 20,
  message: "Demasiadas solicitudes al tenant, please try again after 60 seconds.",
};