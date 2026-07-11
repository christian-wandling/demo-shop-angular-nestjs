FROM docker.io/node:22-alpine AS dev
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts


FROM docker.io/node:22-alpine AS build
RUN apk add --no-cache gettext
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT_UI
ARG SENTRY_DEMO_SHOP_UI_DSN
ARG SENTRY_TRUSTED_DOMAIN
WORKDIR /app
COPY . .
COPY --from=dev /app/node_modules ./node_modules
COPY apps/frontend/src/environments/environment.production.ts /environment.template.ts
RUN envsubst < /environment.template.ts > apps/frontend/src/environments/environment.production.ts \
    && npx nx build frontend


FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

RUN mkdir -p /tmp/nginx \
    && adduser -D appuser \
    && chown -R appuser:appuser /usr/share/nginx/html \
    && chown -R appuser:appuser /var/cache/nginx \
    && chown -R appuser:appuser /var/log/nginx \
    && chown -R appuser:appuser /etc/nginx/conf.d \
    && chown -R appuser:appuser /tmp/nginx \
    && sed -i 's|pid.*|pid /tmp/nginx/nginx.pid;|' /etc/nginx/nginx.conf \
    && rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/apps/frontend/browser ./
COPY static/error-pages /usr/share/nginx/html/error-pages
COPY .ops/nginx/nginx.conf.template /etc/nginx/templates/demo-shop.conf.template

USER appuser
CMD ["nginx", "-g", "daemon off;"]
