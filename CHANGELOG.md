# Changelog

All notable changes to Akinai are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] — 2026-10-17

First public release of [Akinai](https://getakinai.com): an open-source e-commerce monolith with a staff back office and a customer storefront.

### Highlights

- Single AdonisJS 7 app serving both the JSON API and React (Inertia) pages
- Staff admin at `/admin` and customer storefront at `/` and `/account`
- Extensible **plugins** and installable **Edge themes** with a visual editor
- One-command local setup: `yarn setup` → Docker services, migrate, clean or demo seed

### Added

#### Storefront & checkout

- Catalog browsing, cart, and checkout with delivery country prefill for signed-in customers
- Customer accounts (`/signup`, `/login`, `/account`)
- Built-in theme settings under `/admin/storefront/theme` (content and hero folded into one page)
- Cart product images in the checkout order summary

#### Back office

- Products, options, locations, customers, team & permissions
- Media gallery for image uploads across admin flows
- First-run admin setup at `/admin/setup` (home redirects until an admin exists)
- Roles and permissions via `@adonisjs/bouncer`

#### Plugins

- Plugin marketplace and discovery of self-contained folders under `plugins/`
- Template slots for storefront extensions
- Bundled plugins: **Stripe**, **POLi**, **bank transfer**, **hero slideshow**, **newsletter**
- App keeps running if a plugin folder is removed

#### Themes

- Installable Edge theme packages (phase 1), including bundled **Dawn Lite**
- Visual theme editor with live section reorder, preview framing, and app blocks
- Code editor with draftable theme source files
- Theme zip upload, library, and live publish

#### Demo & tooling

- Setup prompt for clean vs demo seed; demo catalog is **Akinai Gadgets** (tech products)
- Docker Compose for PostgreSQL (app + tests), Mailpit, Typesense, and Redis
- Typesense product search reindex commands (`yarn search:sync`)
- CI: lint, typecheck, tests (apt PostgreSQL), and gitleaks secret scan
- Docs: architecture, adding a feature, creating plugins/themes, security, production deployment
- Static HTML doc samples (storefront and hydrated admin) under `docs/html/`

### Requirements

- Node.js 24+
- Yarn Classic
- Docker (for local PostgreSQL, Mailpit, Typesense, Redis)

### Upgrade notes

This is the first tagged release. Clone the repository, run `yarn setup`, then create the first admin at `/admin/setup` using the printed `SETUP_TOKEN`.

[0.0.1]: https://github.com/getakinai/storefront/releases/tag/0.0.1
