# demo-shop-angular-nestjs

Angular frontend and NestJS API in one Nx monorepo, with a Postgres + Keycloak dev stack via Docker Compose.

## Local development

Run from the repo root with a populated `.env` (copy `.env.example`):

- `docker compose up -d --build` — db, keycloak (`:8080`), api (`:3000`), frontend (`:4200`), pgadmin.

A fresh database volume has no schema or data:

- `docker compose exec api npx prisma migrate deploy` — create the schema.
- `npm run prisma:seed` — seed products, users, orders. Run from the **host**, not the api container: the seed reaches Keycloak on `localhost:8080`, which inside a container resolves to the container itself.

The realm ships no users and registration is open — create an account in the browser to log in.

Wiping the Keycloak volume (`docker compose down -v`) regenerates the realm signing keys, so the pinned `KEYCLOAK_REALM_PUBLIC_KEY` in `.env` goes stale and every login fails signature validation. Resync it from the `public_key` field of `http://localhost:8080/realms/demo_shop`, then recreate the api container.

A dependency bump only reaches the running app after a rebuild that renews node_modules — `docker compose up -d --build --renew-anon-volumes --no-deps frontend` — because the `/app/node_modules` volume shadows the freshly built image otherwise.

## Build and test

- `npm run test` — `nx run-many -t test`.
- `npm run lint` — `nx run-many -t lint`.
