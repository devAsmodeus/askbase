# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Dummy public env so `next build` succeeds; real values are provided at runtime.
ENV NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
