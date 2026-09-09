# Multi-stage Dockerfile for PackCheck AI Backend Gateway (Node.js Express)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Final Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install System Chromium for Puppeteer PDF Generation & Security Dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget

ENV NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Ensure non-root node user owns workspace and uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node src ./src

USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ready || exit 1

CMD ["node", "src/server.js"]
