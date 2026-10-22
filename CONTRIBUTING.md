# Contributing

The house rules for working on this app. For how the code fits together, see [docs/architecture.md](docs/architecture.md). For a step-by-step recipe, see [docs/adding-a-feature.md](docs/adding-a-feature.md). For the protections already in place and the security checklist for new features, see [docs/security.md](docs/security.md).

The full rule set that the Cursor AI agent follows lives in `.cursor/rules/`. Those files are the source of truth, and this page summarizes them for humans.

## Non-negotiables

These come up most often in review.

**Backend**

- Follow Validator → Controller → Service → Repository. Controllers never query the database, and services never call Lucid directly.
- One single-action controller per route, with a `handle()` method.
- Validate every mutation body and every query string with a VineJS validator in `app/validators/`.
- Return JSON through transformers (`ctx.serialize(XTransformer.transform(...))`), never raw models.
- Guard every admin route with `middleware.can({ permission: '...' })`, and add new resources to `app/abilities/permissions.ts` first.
- Always pass the guard explicitly: `web` for staff, `customer` for shoppers.
- UUID primary keys, models extend `BaseAppModel`, and migrations are created with `node ace make:migration` and stay reversible.

**Frontend**

- Never pass records as Inertia props. Pages receive ids, then fetch with TanStack Query through `http()`.
- Zod schemas go in `_types.ts`, hooks go in `_hooks.ts`. No inline schemas.
- Use the components in `inertia/components/form/`. Numbers always use `FormInputNumber`.
- Mobile-first: everything works at 320px wide. Use the shared `Page`, `DataTable` and `Dialog` components.
- Create, edit and detail pages have a back link in the `Page` eyebrow, built with a named route.
- No inline `style={{ ... }}` for layout. Use Tailwind (the CSP blocks inline styles).

**General**

- Use Node.js 26.12.1+ (`.nvmrc` pins the CI version) and Yarn 4 (`corepack enable`, vendored in `.yarn/releases/`). Never commit `package-lock.json`, and only commit `yarn.lock` when dependencies change. New dependencies with install scripts need an entry in root `package.json` `dependenciesMeta` (`built: true` or `built: false`).
- Use `node ace` for AdonisJS tasks (`make:migration`, `migration:run`, `db:seed`, ...).
- Every change ships with unit and functional tests.

## Naming

| Thing | Pattern | Example |
|---|---|---|
| Controller file | `<area>_<resource>_<action>_controller.ts` | `admin_locations_store_controller.ts` |
| Controller class | `<Area><Resource><Action>Controller` | `AdminLocationsStoreController` |
| Validator | `<area>_<resource>_<action>_validator.ts` exporting a camelCase const | `adminLocationStoreValidator` |
| Service / repository | `<resource>_service.ts`, `<resource>_repository.ts` | `LocationService` |
| Route name | `<area>.<resource>.<action>` | `admin.locations.store` |
| Permission | `<resource>.<action>` | `locations.archive` |
| Frontend schema | `<Area><Resource>Schema` | `AdminLocationSchema` |
| Frontend hook | `use<Area><Resource>` / `use<Verb><Area><Resource>` | `useAdminLocations`, `useCreateAdminLocation` |

GET routes use `home`, `list`, `create`, `edit`, `view`. Mutations use `store`, `update`, `delete`, `archive`, `unarchive`.

## Branches and commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, lowercase, no period, max 72 chars>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `build`, `ci`.
- Scope is the area changed: `products`, `staff-users`, `customers`, `auth`, `rules`.
- Breaking change: `feat(auth)!: ...` plus a `BREAKING CHANGE:` paragraph.

The body starts with a short paragraph explaining what changed and why, then bullets grouped under `Backend`, `Frontend`, `Tests`, `Rules and tooling`. Mention any manual steps, such as a migration that needs `node ace migration:fresh`.

Example:

```
feat(customers): add customer profiles, accounts and address CRUD
```

See `git log` for more examples, and `.cursor/rules/git-commit-message.mdc` for the full format.

Never commit `.env` or secrets.

Git hooks (Husky) run on `git commit`: staged files are auto-fixed with ESLint
and Prettier, then `yarn lint:check` and `yarn format:check` run on the full
tree. Run
`yarn install` after clone so the `prepare` script installs hooks. Skip hooks
once with `git commit --no-verify` if you must.

## Pull request checklist

- [ ] `yarn typecheck` passes
- [ ] `yarn lint:check` passes
- [ ] `yarn test` passes, with new unit and functional tests for the change
- [ ] New admin routes are guarded with a permission, and the permission is in `permissions.ts`
- [ ] New pages checked in browser device mode at 320px, 390px and 720px wide
- [ ] Migrations roll back cleanly (`node ace migration:rollback`)
- [ ] The PR description lists any manual steps (new env vars, re-seeding, fresh migrations)

## Working with the AI agent

This repo is set up for Cursor. The rules in `.cursor/rules/` load automatically, so the agent already follows the conventions above. When you change a convention, update the matching rule file in the same PR so humans and the agent stay in sync.
