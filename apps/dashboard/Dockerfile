# --- Etapa 1: dependencias ---
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Valor de relleno SOLO para que `next build` no falle si alguna pagina
# intentara ejecutarse en build time (defensa adicional; el fix real es
# `export const dynamic = "force-dynamic"` en los layouts de (admin) y
# (cliente)). Dokploy inyecta el valor REAL en runtime, que sobrescribe
# este placeholder automaticamente - esto nunca llega a producción.
ENV AICORELINK_DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate
RUN npm run build

# --- Etapa 3: runtime ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
