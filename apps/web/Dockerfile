# Apps/Web Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL & libc6-compat for Alpine compatibility
RUN apk add --no-cache openssl libc6-compat

# Copy package files for root and workspaces
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/

# Install dependencies for web workspace
RUN npm ci --workspace=apps/web --ignore-scripts

# Copy source code
COPY apps/web ./apps/web

# Receive build arguments passed from Docker Compose
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_API_URL

# Set environment variables for Next.js build time evaluation
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js app
RUN cd apps/web && npx next build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
