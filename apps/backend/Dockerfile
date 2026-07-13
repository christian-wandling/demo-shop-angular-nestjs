FROM docker.io/node:22-alpine AS dev
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts


FROM docker.io/node:22-alpine AS build
ENV NODE_ENV=production
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_DEMO_SHOP_API_PROJECT
ARG SENTRY_DEMO_SHOP_API_DSN
RUN apk add --no-cache openssl
WORKDIR /app
COPY . .
COPY --from=dev /app/node_modules ./node_modules
RUN npx prisma generate && npx nx build backend
WORKDIR /app/dist/apps/backend
RUN npm ci --ignore-scripts


FROM docker.io/node:22-alpine AS prod
RUN apk add --no-cache dumb-init openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/dist/apps/backend ./
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

RUN chown -R appuser:appgroup /app
USER appuser

CMD ["dumb-init", "node", "main.js"]
