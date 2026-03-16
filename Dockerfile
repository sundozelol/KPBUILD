# ─── Stage 1: Build frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ─── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM node:20-alpine

# Chromium + Cyrillic fonts for Puppeteer PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-extra \
    vips-dev \
    python3 \
    make \
    g++

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production --prefer-offline

# Copy backend source
COPY backend/src ./backend/src

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Runtime env defaults (override via docker-compose or -e flags)
ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOADS_DIR=/uploads

VOLUME ["/uploads"]
EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "src/index.js"]
