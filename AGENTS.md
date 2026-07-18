# demo-shop-angular-nestjs

Angular frontend and NestJS API in one Nx monorepo, with a Postgres + Keycloak stack via Docker Compose.

## Dev environment tips
- Copy `.env.example` to `.env`, then `docker compose up -d --build`. It publishes the frontend, API, and Keycloak on the ports set in `.env` (see `.env.example` for defaults).
- Initialize a fresh database with `docker compose exec api npx prisma migrate deploy`, then `npm run prisma:seed`.
- Run the seed from the host, not the api container — it reaches Keycloak on `localhost:${KEYCLOAK_PORT}`, which resolves to the container itself when run inside one.
- The realm ships no users and registration is open; sign up in the browser to log in.
- After a dependency bump, rebuild with `--renew-anon-volumes` or the `node_modules` volume shadows the new image.
- After `docker compose down -v`, resync `KEYCLOAK_REALM_PUBLIC_KEY` in `.env` from `http://localhost:${KEYCLOAK_PORT}/realms/demo_shop`, or logins fail signature checks.

## Testing instructions
- `npm run test` runs `nx run-many -t test`; `npm run lint` runs `nx run-many -t lint`.
- Fix any failing test, type, or lint error before committing.

## PR instructions
- Commit format: `type(scope): subject` — lowercase, ≤72 chars, scope is an Nx project name or omitted.
- Run `npm run lint` and `npm run test` green before pushing.
