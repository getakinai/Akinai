# Adding a feature

This walkthrough adds a back-office CRUD resource end to end. It mirrors the existing **Locations** feature, so open those files alongside this guide and copy from them:

| Layer | Reference file |
|---|---|
| Migration | `database/migrations/*_create_locations_table.ts` |
| Model | `app/models/location.ts` |
| Repository | `app/repositories/location_repository.ts` |
| Service | `app/services/location_service.ts` |
| Validators | `app/validators/admin_location_store_validator.ts`, `admin_locations_list_query_validator.ts` |
| Transformer | `app/transformers/location_transformer.ts` |
| Policy | `app/policies/location_policy.ts` |
| Controllers | `app/controllers/admin/admin_locations_*_controller.ts` |
| Routes | `start/routes.ts` (search for `admin.locations`) |
| Frontend | `inertia/pages/admin/locations/` |
| Tests | `tests/functional/admin/admin_locations.spec.ts` |

The example below uses a made-up `Supplier` resource.

## 1. Database

```bash
node ace make:migration create_suppliers_table
```

Never create migration files by hand. In the generated file:

```ts
this.schema.createTable('suppliers', (table) => {
  table.uuid('id').primary()
  table.string('name').notNullable()
  table.boolean('is_active').notNullable().defaultTo(true)
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').nullable()
})
```

Foreign keys: `table.uuid('location_id').references('id').inTable('locations')`. Then run `node ace migration:run`.

## 2. Model

`app/models/supplier.ts`. Extend `BaseAppModel` and declare every column except `id`, `createdAt` and `updatedAt`:

```ts
export default class Supplier extends BaseAppModel {
  @column()
  declare name: string

  @column()
  declare isActive: boolean
}
```

## 3. Repository and service

- `app/repositories/supplier_repository.ts`: all queries (`paginate`, `findOrFail`, `create`, `update`). Nothing else in the app touches the model directly.
- `app/services/supplier_service.ts`: injected with `@inject()`, applies defaults and business rules, and calls the repository.

## 4. Validators

One file per validator in `app/validators/`:

- `admin_supplier_store_validator.ts`
- `admin_supplier_update_validator.ts`
- `admin_suppliers_list_query_validator.ts` (for `q`, `sort`, `page`, `perPage`)

A single `:id` route param is already checked by `UuidRouteParamMiddleware`, so you don't need a validator for it. Other params (`:slug`, `:valueId`) do need one.

## 5. Transformer

`app/transformers/supplier_transformer.ts` extends `BaseTransformer` and uses `this.pick(...)` to list exposed fields. Never return a raw model.

## 6. Permission

Add the resource to `PERMISSION_SECTIONS` in `app/abilities/permissions.ts`:

```ts
{
  key: 'suppliers',
  label: 'Suppliers',
  description: 'Companies we buy stock from',
  actions: ['view', 'create', 'edit', 'archive'],
},
```

Grant it to roles in `database/seeders/role_seeder.ts` if the built-in roles should have it. The `admin` role always has everything.

If a rule depends on the record itself (for example "can't archive a supplier with open orders"), add `app/policies/supplier_policy.ts` and return `AuthorizationResponse.deny(message, 422)`.

## 7. Controllers

One single-action controller per route in `app/controllers/admin/`:

| File | Route | Returns |
|---|---|---|
| `admin_suppliers_home_controller.ts` | `GET /admin/suppliers` | `inertia.render('admin/suppliers/home', {})` |
| `admin_suppliers_list_controller.ts` | `GET /admin/suppliers/list` | `SupplierTransformer.paginate(...)` |
| `admin_suppliers_store_controller.ts` | `POST /admin/suppliers` | `201` + `SupplierTransformer.transform(...)` |
| `admin_suppliers_update_controller.ts` | `PUT /admin/suppliers/:id` | `SupplierTransformer.transform(...)` |
| `admin_suppliers_edit_controller.ts` (if it has its own page) | `GET /admin/suppliers/edit/:id` | `inertia.render('admin/suppliers/edit', { id: params.id })` |
| `admin_suppliers_view_controller.ts` (if it has its own page) | `GET /admin/suppliers/:id/view` | `SupplierTransformer.transform(...)` |

Inertia shell controllers pass **only** ids. Data always comes from the JSON controllers.

## 8. Routes

In `start/routes.ts`, inside the authenticated `/admin` group, guard each route with its permission:

```ts
router
  .group(() => {
    router.get('suppliers', [controllers.admin.AdminSuppliersHome]).as('admin.suppliers.home')
    router.get('suppliers/list', [controllers.admin.AdminSuppliersList]).as('admin.suppliers.list')
  })
  .use(middleware.can({ permission: 'suppliers.view' }))

router
  .post('suppliers', [controllers.admin.AdminSuppliersStore])
  .as('admin.suppliers.store')
  .use(middleware.can({ permission: 'suppliers.create' }))
```

`controllers.admin.AdminSuppliersHome` comes from a generated barrel. Keep `yarn dev` running so it picks up new controller files, or TypeScript will say the controller doesn't exist.

## 9. Frontend

Create `inertia/pages/admin/suppliers/`:

- `_types.ts`: `AdminSupplierSchema`, the list response (`paginatedResponse(AdminSupplierSchema)` from `~/lib/schemas`), the form schema, and `z.infer` types.
- `_hooks.ts`: a key factory (`adminSuppliersKeys`), `fetchAdminSuppliers` + `useAdminSuppliers`, and mutation hooks that call `invalidateQueries` on success. Use `http()` for every call.
- `home.tsx`: `<Page>` + `DataTableToolbar` + `InfiniteDataTable` (rows load 25 at a time as the user scrolls). Create/edit can be a dialog, like `_location_dialog.tsx`.
- `create.tsx` / `edit.tsx` (only if they are full pages): add a back link in the eyebrow:

```tsx
<Page
  eyebrow={
    <Link route="admin.suppliers.home" className="inline-flex items-center gap-1 hover:text-ink">
      <ArrowLeft size={12} /> Suppliers
    </Link>
  }
  title="Add supplier"
/>
```

Then add the nav entry in `inertia/components/admin/admin_nav.ts` with `permission: 'suppliers.view'`, and hide action buttons with `useCan('suppliers.create')`.

Form rules: use `FormInput`, `FormInputNumber` (for any number), `FormSelect`, `FormButton`. Show server validation errors with `handleMutationError()` from `~/lib/form`. Design for 320px wide first.

## 10. Tests

- `tests/unit/supplier_service.spec.ts` for business logic.
- `tests/functional/admin/admin_suppliers.spec.ts` covering:
  - the happy path for list, store and update
  - 422 validation errors
  - 403 for a User without the permission (`createAdminUser(['suppliers.view'])`)
  - policy denials

Run `yarn test`.

## 11. Before opening a PR

```bash
yarn typecheck
yarn lint:check
yarn test
```

Then check the page in your browser's device mode at 320px, 390px and 720px wide.
