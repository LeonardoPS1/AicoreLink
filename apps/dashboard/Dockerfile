# --- Etapa 1: dependencias ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma 5.x detecta y usa automaticamente el motor compatible con OpenSSL 3
# de Alpine moderno - NO se necesita instalar openssl1.1-compat (ese paquete
# fue removido de los repos de Alpine 3.17+ y rompe el build si se agrega).
RUN npx prisma generate
RUN npm run build

# --- Etapa 3: runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
