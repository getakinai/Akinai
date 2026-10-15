# Akinai

[Akinai](https://getakinai.com) is an open-source e-commerce app with a staff back office (`/admin`) and a customer storefront (`/`, `/account`). It is a single monolith: AdonisJS serves the API and renders React pages through Inertia.js.

## Quick start

With Node 24+, Yarn and Docker installed:

```bash
yarn setup   # install, create .env, start Docker, migrate, seed
yarn dev     # http://localhost:3333
```

Then open http://localhost:3333/admin/setup to create your admin account. `yarn setup` prints the setup token the form asks for (it's also `SETUP_TOKEN` in `.env`). See [Create the first admin](#6-create-the-first-admin).

The rest of this page explains each step. See [Running locally](#running-locally) if `yarn setup` fails.

## New to the project?

Work through these in order. It takes about an hour.

1. **Get it running**: follow the quick start above, then click around the back office (Products, Options, Locations, Customers, Team & Permissions) and sign up as a customer at `/signup`.
2. **Understand the shape**: read [docs/architecture.md](docs/architecture.md). It covers the request flow, the two account types, permissions and the frontend data flow.
3. **Learn the rules**: read [CONTRIBUTING.md](CONTRIBUTING.md) for conventions, naming, commit format and the PR checklist.
4. **Trace one feature**: follow **Locations** from `start/routes.ts` (search `admin.locations`) through its controllers, service, repository and `inertia/pages/admin/locations/`. It is the smallest complete CRUD feature.
5. **Build something**: use [docs/adding-a-feature.md](docs/adding-a-feature.md) as a checklist for your first change, and check it against [docs/security.md](docs/security.md).

## Technology

### Backend

| Area             | Technology                                                                       |
| ---------------- | -------------------------------------------------------------------------------- |
| Runtime          | Node.js 24+, TypeScript                                                          |
| Framework        | [AdonisJS 7](https://docs.adonisjs.com)                                          |
| Database         | PostgreSQL 18 via [Lucid ORM](https://lucid.adonisjs.com) (`pg` driver)          |
| Validation       | [VineJS](https://vinejs.dev)                                                     |
| Authentication   | `@adonisjs/auth` session guards: `web` for staff Users, `customer` for Customers |
| Authorization    | `@adonisjs/bouncer` with database-backed roles and permissions                   |
| Security         | `@adonisjs/shield` (CSRF, CSP), `@adonisjs/cors`, `@adonisjs/session`            |
| Maintenance mode | `@foadonis/maintenance`                                                          |

The backend uses a layered pattern: **Validator → Controller → Service → Repository**, with transformers in `app/transformers/` shaping every JSON response. Controllers are single-action classes with a `handle()` method.

### Frontend

| Area          | Technology                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------- |
| UI            | React 19 + TypeScript, rendered through [Inertia.js](https://inertiajs.com)                    |
| Data fetching | [TanStack Query](https://tanstack.com/query) with the `http()` helper in `inertia/lib/http.ts` |
| Schemas       | [Zod](https://zod.dev)                                                                         |
| Styling       | Tailwind CSS 4, Inter font, `lucide-react` icons                                               |
| Rich text     | Slate                                                                                          |
| Toasts        | Sonner                                                                                         |
| Bundler       | Vite 8 (`@adonisjs/vite`) with HMR                                                             |

Inertia pages only receive route ids; records are always fetched from JSON endpoints with TanStack Query.

### Tooling

- **Package manager:** Yarn classic (`yarn.lock`)
- **Tests:** [Japa](https://japa.dev) (unit and functional suites)
- **Lint and format:** ESLint (`@adonisjs/eslint-config`) and Prettier
- **Local services:** Docker Compose (PostgreSQL, a separate test PostgreSQL, Mailpit)

## Project structure

```
app/
  abilities/      Bouncer abilities and the permission catalog
  controllers/    Single-action controllers (admin/, customers/)
  middleware/     HTTP middleware (auth, guest, permissions, UUID params, ...)
  models/         Lucid models (extend BaseAppModel, UUID v7 ids)
  policies/       Record-level authorization rules
  repositories/   Database queries and transactions
  services/       Business logic
  transformers/   Response shaping
  validators/     VineJS validators
commands/         Custom ace commands (create:admin-user)
config/           AdonisJS configuration
docs/             Architecture and how-to guides
database/
  migrations/     Schema migrations
  seeders/        Roles, default location, option definitions, dev admin user
inertia/
  components/     Shared React components (form/, data_table/, page shell, admin nav)
  layouts/        Admin and storefront layouts
  lib/            http(), form helpers, styles
  pages/          admin/, customers/, errors/, home.tsx
scripts/          setup.sh (used by yarn setup)
start/            Routes, kernel (middleware), env validation
tests/            unit/ and functional/ Japa suites
```

## Running locally

`yarn setup` runs steps 1 to 4 below for you (including generating `SETUP_TOKEN`) and is safe to re-run. The manual steps are here for when you need to run one on its own.

### Prerequisites

- Node.js 24 or newer
- Yarn classic (`npm i -g yarn`)
- Docker (for PostgreSQL and Mailpit)

The Docker Compose file for the local development services lives in [`.infra/`](.infra/README.md).

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure the environment

```bash
cp .env.example .env
node ace generate:key
```

`generate:key` writes `APP_KEY` into `.env`. The default database credentials in `.env.example` match the Docker containers. Set `APP_NAME` if you want a different store name.

Set `SETUP_TOKEN` to 32 or more random characters so you can create the first admin later (`yarn setup` does this for you):

```bash
openssl rand -hex 32
```

### 3. Start the Docker services

```bash
yarn docker:up
```

This starts five containers from `.infra/docker-compose.yml`, using values from `.env`:

| Service                    | Address               |
| -------------------------- | --------------------- |
| PostgreSQL (app)           | `127.0.0.1:5432`      |
| PostgreSQL (tests)         | `127.0.0.1:5433`      |
| Mailpit SMTP               | `127.0.0.1:2525`      |
| Mailpit inbox UI           | http://localhost:8025 |
| Typesense (product search) | http://localhost:8108 |
| Redis (rate limiter)       | `127.0.0.1:6379`      |

Use `yarn docker:ps`, `yarn docker:logs` and `yarn docker:down` to manage them.

### 4. Migrate and seed the database

```bash
yarn db:migrate
yarn db:seed
```

`yarn db:seed` is the minimal setup. It creates the store configuration only:

- Store settings, storefront theme and a starter menu
- The built-in roles (`admin`, `manager`, `staff`)
- The New Zealand (primary, NZD) and Australia (AUD) markets
- New Zealand GST
- A default stock location
- A Manila City (PH) shipping zone with a standard rate in NZD and AUD

In development only, it also adds a starter catalog (10 products in 5 collections, priced in NZD and AUD). It doesn't create any staff Users; you create the first admin yourself in step 6.

For a fuller store to click around in, run `yarn db:seed:demo` after `yarn db:seed`. It adds about 100 demo products in 8 collections, sample product types, vendors and Size/Color options, and draft example collections. Both seeds are safe to re-run; existing records are skipped.

Create the product search collection in Typesense, then index the catalog (run the reindex again any time the index drifts; product changes in the back office are indexed automatically):

```bash
yarn search:sync
```

This creates the Typesense collection when it is missing, then indexes every product. After changing the collection fields in `config/magnify.ts`, run `yarn search:sync:fresh` to drop and recreate it (Typesense cannot change an existing collection's settings).

### 5. Start the dev server

```bash
yarn dev
```

The app runs at http://localhost:3333 with hot reload.

- Back office: http://localhost:3333/admin/login
- Storefront: http://localhost:3333 (customers register at `/signup`)

### 6. Create the first admin

While there are no staff Users, http://localhost:3333/admin/login redirects to `/admin/setup`. Enter the `SETUP_TOKEN` from `.env`, the country your store delivers to (it picks the starting markets and shipping zones), and your name, email and password. This creates your account with the `admin` role and signs you in. The page closes for good once any staff User exists.

Add more staff later at **Team & Permissions** in the back office, or from the command line (staff have no public signup):

```bash
node ace create:admin-user
```

### Bot protection (reCAPTCHA v3 and rate limits)

Admin login, customer login, signup and checkout are protected by Google reCAPTCHA v3, and logins and checkout are rate limited (Redis-backed, `start/limiter.ts`). reCAPTCHA is off locally by default. To turn it on, create v3 keys at https://www.google.com/recaptcha/admin (add `localhost` as a domain) and set in `.env`:

```bash
RECAPTCHA_ENABLED=true
RECAPTCHA_SECRET_KEY=your-secret-key
VITE_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_MIN_SCORE=0.5
```

Restart `yarn dev` after changing `VITE_*` values. Tests use `RECAPTCHA_ENABLED=false` and the in-memory limiter store.

## Tests

Tests use the separate test database on port 5433 (see `.env.test`). Migrations run automatically before the suite.

```bash
yarn test                          # all suites
node ace test unit                 # unit tests only
node ace test functional           # functional tests only
```

## Other scripts

| Command                         | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `yarn typecheck`                | Type-check the backend and the Inertia frontend |
| `yarn lint` / `yarn lint:check` | Run ESLint with or without auto-fix             |
| `yarn format`                   | Format with Prettier                            |
| `yarn build`                    | Build the production bundle into `build/`       |
| `yarn start`                    | Run the built server (`node bin/server.js`)     |

## Day-to-day commands

| Task                                                                                               | Command                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Create a migration                                                                                 | `node ace make:migration create_suppliers_table`                         |
| Run pending migrations                                                                             | `yarn db:migrate`                                                        |
| Roll back the last batch                                                                           | `node ace migration:rollback`                                            |
| Rebuild the database from scratch                                                                  | `node ace migration:fresh --seed`                                        |
| Fill the storefront with demo products, collections, options and menu links (after `yarn db:seed`) | `yarn db:seed:demo`                                                      |
| Create a staff User                                                                                | `node ace create:admin-user`                                             |
| Rebuild the product search index                                                                   | `yarn search:sync` (`yarn search:sync:fresh` to recreate the collection) |
| Open a REPL with the app loaded                                                                    | `node ace repl`                                                          |
| List every route and its name                                                                      | `node ace list:routes`                                                   |
| Run a single test file                                                                             | `node ace test --files=tests/functional/admin/admin_locations.spec.ts`   |

## Troubleshooting

**`E_MISSING_ENV_VALUE` or `Missing environment variable "APP_KEY"`.** Run `node ace generate:key`. If `.env` doesn't exist, copy it from `.env.example` first.

**`ECONNREFUSED 127.0.0.1:5432` when starting the app or migrating.** PostgreSQL isn't running. Start Docker Desktop, then `yarn docker:up`, and check with `yarn docker:ps`.

**`port is already allocated` when starting Docker.** Another service is using the port, often a locally installed PostgreSQL on 5432. Stop it, or change `DB_PORT` (and `TEST_DB_PORT` / `MAILPIT_*_PORT` if needed) in `.env` and re-run `yarn docker:up`. Ports 1025 and 1026 are often taken by macOS, which is why Mailpit SMTP defaults to 2525.

**Tests fail to connect to the database.** Tests use the separate `databaseTest` container on port 5433. Make sure `yarn docker:up` started it.

**TypeScript says `controllers.admin.SomethingNew` doesn't exist.** The controller barrel in `.adonisjs/` is generated by the dev server. Keep `yarn dev` running when you add controllers.

**`403` on every admin page for a new staff User.** New Users get the `staff` role, which has few permissions. Grant more at `/admin/roles` while signed in as an admin, or create the User with `node ace create:admin-user --role=admin`.

**Mutations fail with `403 Invalid or expired CSRF token` (`E_BAD_CSRF_TOKEN`).** Use the `http()` helper from `inertia/lib/http.ts`. It sends the `X-XSRF-TOKEN` header that Shield requires. Plain `fetch` calls don't.

**Want a clean slate.** `yarn docker:down`, then `docker volume rm akinai_postgres_volume akinai_postgres_volume_test`, then `yarn setup`.

## Deployment

This repository does not ship deployment tooling; host it however suits you (a container platform, a VM, a PaaS). Build with `yarn build` and run `node bin/server.js` from `build/` after `yarn install --production`. Run `node ace migration:run --force` on each release.

In production (`NODE_ENV=production`) the app refuses to boot unless:

- `SESSION_DRIVER=database`
- `LIMITER_STORE=redis`, with `REDIS_HOST` / `REDIS_PASSWORD` pointing at a Redis server
- S3 storage is configured (see [File uploads](#file-uploads))

Optional settings:

- **HTTPS in Node:** set `TLS_CERT_PATH` and `TLS_KEY_PATH` to serve HTTPS directly. `HEALTH_PORT` adds a plain-HTTP `/health` listener on `127.0.0.1` for health checks. Without them the app serves plain HTTP, for use behind a reverse proxy.
- **Managed Postgres over TLS:** `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true` and `DB_SSL_CA_PATH`.
- **Search:** `SEARCH_ENGINE=typesense`, `TYPESENSE_NODE_URL` and `TYPESENSE_API_KEY`, then `node ace search:reindex-products` after the first deploy.
- **Trusted proxies:** `config/app.ts` trusts `X-Forwarded-For` only from loopback and [Cloudflare's IP ranges](https://www.cloudflare.com/ips/). Change that list if you run behind a different proxy.

### Creating the first admin

This works the same as [locally](#6-create-the-first-admin), with a fresh token:

1. Run `node ace db:seed` first so the `admin` role exists.
2. Generate a token with `openssl rand -hex 32` (it must be at least 32 characters), set `SETUP_TOKEN=<token>` in the environment and restart the app.
3. Open `https://<domain>/admin/setup` and fill in the form.
4. Remove `SETUP_TOKEN` and restart again. The page closes once any staff User exists, but the token shouldn't stay around.

Wrong tokens are logged as `setup_failed` security events and the form is rate-limited.

### Seeding in production

`db:seed` and `seed:demo-store` ask for confirmation when `NODE_ENV=production` (the default answer is no), so run them in an interactive terminal. Without a TTY they refuse to run. For a deliberate non-interactive run, pass the command name for that one run only, and never keep it in the environment:

```bash
CONFIRM_PRODUCTION_COMMAND=db:seed node ace db:seed
```

### File uploads

Product photos are stored with [AdonisJS Drive](https://docs.adonisjs.com/guides/digging-deeper/drive). Locally and in tests, `DRIVE_DISK=fs` writes files to `storage/` (git-ignored) and serves them at `/uploads`. Production (`NODE_ENV=production`) always uses S3, whatever `DRIVE_DISK` says, because app instances are usually replaced on every deploy and don't share a filesystem. It refuses to boot unless `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` and `S3_BUCKET` are set (plus `S3_ENDPOINT` for S3-compatible services). Payment proofs go to `S3_PRIVATE_BUCKET` when it is set; otherwise they share `S3_BUCKET` under `private/`, so block `/private/*` in CloudFront. Set `CDN_URL` to serve images from a CDN such as CloudFront. The database stores Drive keys, not URLs, so changing disks or CDNs does not need a migration.

### Scheduled jobs

Run these once a day with cron (or your host's scheduler) from the app directory:

```bash
# Delete used or expired sign-up and password reset codes
0 3 * * * node ace customers:prune-verification-codes

# Delete email monitor logs older than 90 days (they hold customer names and addresses)
15 3 * * * node ace emails:prune
```

### Email

Every email the store sends is logged at **Settings → Emails** (`/admin/emails`), with its recipients, content and delivery status. Emails with one-time codes are logged without their content. Before going live, set up SPF, DKIM and DMARC for the sending domain through your SMTP provider, and set `MAIL_FROM_ADDRESS` to an address on that domain.

## License

Akinai is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version. See [LICENSE](LICENSE) for the full text.

To report a security issue, see [SECURITY.md](SECURITY.md).
