# ------------------------------------------------------------------------------
# CardPulse - Dynamic OpenGraph & Social Card Generator
# Production Multi-Stage Container Definition
# ------------------------------------------------------------------------------

# Stage 1: Build Environment
FROM node:22-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for Linux
RUN apk add --no-cache python3 make g++

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source and fonts
COPY tsconfig.json ./
COPY cmd/ ./cmd/
COPY community/ ./community/
COPY internal/ ./internal/
COPY assets/ ./assets/

# Compile TypeScript
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Install runtime utilities for container healthchecks
RUN apk add --no-cache curl wget

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

# Security: Non-root execution
RUN addgroup -S cardpulse && adduser -S cardpulse -G cardpulse
USER cardpulse

EXPOSE 3000

# Docker native healthcheck
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start Fastify synthesis engine
CMD ["node", "dist/cmd/server.js"]
