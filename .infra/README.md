# Akinai — Local development services

This folder holds **no application code**. The app (AdonisJS + Inertia/Vite, Node 24+, Yarn 4) is the repository root. Docker images here are pinned by digest in `docker-compose.yml`.

`docker-compose.yml` runs only the supporting services. The app itself runs on your machine with `yarn dev`.

| Service        | Image                      | Host port (default)        | Purpose              |
| -------------- | -------------------------- | -------------------------- | -------------------- |
| `database`     | `postgres:18`              | `5432`                     | App database         |
| `databaseTest` | `postgres:18`              | `5433`                     | Test database        |
| `mailhog`      | `axllent/mailpit:latest`   | `1025` (SMTP), `8025` (UI) | Catches outgoing email |
| `typesense`    | `typesense/typesense:29.0` | `8108`                     | Product search index |
| `redis`        | `redis:7-alpine`           | `6379`                     | Rate limiter store   |

All ports are bound to `127.0.0.1` only. Credentials and ports are read from the app's `.env`. Run this from the repository root:

```bash
yarn docker:up   # docker compose -f .infra/docker-compose.yml --env-file .env up -d
yarn dev
```

Other helpers: `yarn docker:down`, `yarn docker:logs`, `yarn docker:ps`.

To rebuild the product search index:

```bash
node ace search:reindex-products
```

Keep the Postgres major version here in step with CI (`.github/workflows/ci.yml`) and whatever database you deploy against.
