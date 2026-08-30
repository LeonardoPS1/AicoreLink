// Rate limiting middleware for AicoreLink
// Usa Redis @upstash/ratelimit si está configurado, otherwise fallback a límite en memoria

const rateLimit = require("express-rate-limit");

// Rate limiter general de API
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Límite de 100 requests por IP por minuto
  message: "Too many requests from this IP, please try again after 60 seconds.",
});

// Configuración para RateLimiterRedis (usar cuando Redis esté disponible)
/**
 * Para usar RateLimiterRedis con @upstash/ratelimit:
 * 1. Tener instancia de Redis conectada
 * 2. const ratelimit = new RateLimiterRedis({ redis, ... })
 * 3. Usar en routes: await ratelimit.limit(key)
 *
 * Para development sin Redis, el generalLimiter arriba es suficiente.
 */