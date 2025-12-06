# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - BOTSITOT
# Multi-stage build para optimizar tamaño
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# STAGE 1: Builder (compilar TypeScript)
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig. json ./

# Instalar dependencias (incluidas dev para compilar)
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript (si usas TS, sino omitir)
# RUN npm run build

# ─────────────────────────────────────────────────────────────
# STAGE 2: Runner (imagen final ligera)
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de entorno para Puppeteer (whatsapp-web.js)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar código compilado desde builder
COPY --from=builder /app/node_modules/. prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Crear directorios necesarios
RUN mkdir -p /app/. wwebjs_auth /app/. wwebjs_cache /app/logs

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "src/app.js"]