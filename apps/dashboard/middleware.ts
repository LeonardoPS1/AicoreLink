// Rate limiting middleware for AicoreLink
// 
// NOTA: Next.js App Router tiene su propio sistema de middleware.
// Para rate limiting real, configurar @upstash/ratelimit con Redis en los API routes
// o usar middleware de nivel de infraigura (Dokploy/Traefik).
//
// Este archivo exporta configuraciones para uso en API routes y un middleware mínimo.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Minimal middleware - passes through all requests. Real rate limiting at infra level. */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

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