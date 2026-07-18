# demo-shop-angular-nestjs

Angular frontend and NestJS API in one Nx monorepo, with a Postgres + Keycloak stack via Docker Compose.

## Dev environment tips
- Copy `.env.example` to `.env`, then `docker compose up -d --build`. Ports come from `.env`.
- Initialize a fresh database: `docker compose exec api npx prisma migrate deploy`, then `npm run prisma:seed` from the host.
- Set `KEYCLOAK_REALM_PUBLIC_KEY` in `.env` to Keycloak's realm `public_key` from `/realms/demo_shop` after the first boot.
- Register a user in the browser to log in.
- Bump a dependency with `docker compose up -d --build --renew-anon-volumes`.

## PR instructions
- A commit scope must be an Nx project name or omitted, enforced by commitlint `config-nx-scopes`.
