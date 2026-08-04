# demo-shop-angular-nestjs

Angular frontend and NestJS API in one Nx monorepo, with a Postgres + Keycloak stack via Docker Compose.

## Dev environment tips

- Copy `.env.example` to `.env`, then `docker compose up -d --build`. Ports come from `.env`.
- Initialize a fresh database: `docker compose exec api npx prisma migrate deploy`, then `npm run prisma:seed` from the host.
- The api resolves Keycloak's signing keys from its JWKS endpoint over the shared `backend` network via `KEYCLOAK_INTERNAL_URL`, while `KEYCLOAK_URL` stays the browser-facing origin the token's `iss` carries.
- Register a user in the browser to log in.
- Bump a dependency with `docker compose up -d --build --renew-anon-volumes`.

## PR instructions

- A commit scope must be an Nx project name or omitted, enforced by commitlint `config-nx-scopes`.
