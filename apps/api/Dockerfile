# Apps/API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine binary compatibility in Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy root and workspace package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/src/prisma ./apps/api/src/prisma

# Install dependencies and generate Prisma Client
RUN npm ci --workspace=apps/api
RUN cd apps/api && npx prisma generate --schema=src/prisma/schema.prisma

# Copy source code and build TypeScript
COPY apps/api ./apps/api
RUN cd apps/api && npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Copy dependencies and build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/src/prisma ./apps/api/src/prisma

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/server.js"]
