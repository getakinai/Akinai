# Creating a theme

Themes change how the storefront looks. Staff manage them from **Online Store > Themes** in the back office (`/admin/themes`). A theme is a zip file that staff upload; the app stores it, validates it, and renders storefront pages with it once it is published. Themes never affect the back office.

Themes follow Shopify's model: a layout wraps every page, each page type has a JSON template listing its **sections**, and sections can hold **blocks**. Section and block settings are declared in a schema, so the visual editor (coming in phase 2) can edit them without touching code. Templates are written in [Edge](https://edgejs.dev).

The store keeps a **library** of themes. Exactly one is **live**; the others are unpublished and can be previewed, shared, duplicated, renamed, downloaded or deleted. When no uploaded theme is live, the storefront uses the **built-in theme**, the React storefront configured from **Online Store > Built-in theme**.

Use **Dawn Lite** as the reference: `themes/dawn_lite/`. Folders in `themes/` are added to the library automatically the first time the Themes page loads.

| Part | Reference |
|---|---|
| Reference theme | `themes/dawn_lite/` |
| Package reader and validator | `app/themes/package.ts`, `app/themes/schema.ts` |
| Limits, setting types, banned code | `app/constants/themes.ts` |
| Storage and extraction cache | `app/themes/storage.ts` |
| Rendering | `app/themes/renderer.ts`, `app/themes/settings_resolver.ts`, `resources/views/themes/` |
| Library, upload, publish | `app/services/theme_service.ts`, `app/repositories/theme_repository.ts` |
| Tables | `themes`, `theme_settings`, `theme_templates` |
| React islands | `inertia/islands.tsx`, `inertia/islands/registry.tsx` |
| Admin page | `inertia/pages/admin/themes/home.tsx` |
| Tests | `tests/unit/theme_package.spec.ts`, `tests/functional/admin/admin_themes.spec.ts` |

## Package layout

```
theme.json                  key, name, version, author?, description?, previewImage?
preview.png                 optional; shown in the theme library
layout/
  theme.edge                wraps every page
templates/
  index.json                home page (required)
  product.json              product pages
  collection.json           collection pages
  page.json                 content pages
  page.contact.json         alternate template, used with ?view=contact
sections/
  header.edge               one file per section type
  header.schema.json        its settings, blocks and presets (optional)
snippets/
  product_card.edge         partials, pulled in with @include
assets/
  base.css                  CSS, images, fonts (no JavaScript)
config/
  settings_schema.json      theme-wide settings
  settings_data.json        saved values for those settings and static sections
locales/
  en.default.json           strings for t('key')
```

Zip the folder (or its contents) and upload it. A single wrapper folder, as made by "Compress" on macOS, is stripped. Hidden files and `__MACOSX/` are ignored.

A template that is missing falls back to the built-in theme for that page type. Only `index.json` is required.

## theme.json

```json
{
  "key": "dawn_lite",
  "name": "Dawn Lite",
  "version": "1.0.0",
  "author": "Akinai",
  "description": "A clean, minimal theme built from sections.",
  "previewImage": "preview.png"
}
```

`key` uses lowercase letters, digits and `_`. Uploading the same zip twice adds a second copy; each upload is its own library entry.

## Layout

`layout/theme.edge` is a full HTML document. It must print `akinaiHead` inside `<head>` (meta tags, SEO, the islands script) and `contentForLayout` where the page's sections go. Static sections, such as the header and footer, render with `renderSection`:

```edge
<!DOCTYPE html>
<html lang="en">
  <head>
    {{{ akinaiHead }}}
    <link rel="stylesheet" href="{{ assetUrl('base.css') }}" />
  </head>
  <body style="--color-text: {{ settings.color_text }}">
    {{{ await renderSection('header') }}}
    <main>{{{ contentForLayout }}}</main>
    {{{ await renderSection('footer') }}}
  </body>
</html>
```

Use `{{ }}` for anything that should be escaped and `{{{ }}}` only for HTML the app produces: `akinaiHead`, `contentForLayout`, `renderSection`, `island`, `pluginSlot`, and `richtext` settings, which are sanitized before they reach the theme.

## Templates

A template is JSON: the sections on the page and their order. Each section has an id (any name), a `type` (a file in `sections/`), its settings, and optionally blocks.

```json
{
  "sections": {
    "banner": {
      "type": "image_banner",
      "settings": { "height": "large" },
      "blocks": {
        "heading": { "type": "heading", "settings": { "heading": "Made to last" } },
        "button": { "type": "button", "settings": { "label": "Shop now" } }
      },
      "block_order": ["heading", "button"]
    },
    "hero_plugin": { "type": "plugin_slot", "settings": { "slot": "home.hero" } }
  },
  "order": ["banner", "hero_plugin"]
}
```

Set `"disabled": true` on a section or block to hide it without deleting it. Customers can be sent to an alternate template with `?view=<suffix>`, for example `/pages/contact?view=contact` uses `templates/page.contact.json`.

Staff edits are stored in `theme_templates` and `theme_settings`, not in the zip. **Download** rebuilds the zip with the saved values, so a theme can be edited elsewhere and uploaded again.

## Sections and schemas

A section is an Edge file. Its settings and blocks come from `<type>.schema.json`:

```json
{
  "name": "Testimonials",
  "settings": [{ "type": "text", "id": "heading", "label": "Heading", "default": "What customers say" }],
  "blocks": [
    {
      "type": "quote",
      "name": "Testimonial",
      "limit": 6,
      "settings": [{ "type": "textarea", "id": "quote", "label": "Quote" }]
    }
  ],
  "max_blocks": 6,
  "enabled_on": { "templates": ["index", "page"] },
  "presets": [{ "name": "Testimonials", "blocks": [{ "type": "quote" }] }]
}
```

Inside the section, `section.settings` holds the resolved values (defaults filled in), and `section.blocks` holds the visible blocks in order. Print `block.attrs` on each block's outer element; the editor uses it to find the block.

```edge
<ul>
  @each(block in section.blocks)
    <li {{{ block.attrs }}}>{{ block.settings.quote }}</li>
  @end
</ul>
```

`presets` makes a section addable from the editor. `enabled_on.templates` limits where it can be added. Sections without a schema have no settings.

### Setting types

| Type | Value in the template |
|---|---|
| `text`, `textarea`, `url` | string |
| `richtext` | sanitized HTML; print with `{{{ }}}` |
| `checkbox` | boolean |
| `number`, `range` | number (`min`, `max`, `step`, `unit`) |
| `select`, `radio` | the chosen `value` from `options` |
| `color` | hex string such as `#121212` |
| `image_picker` | `{ key, url }` or null. Values starting with `assets/` point at the theme's own files |
| `css` | staff custom stylesheet; **not** passed into `settings` in Edge. Akinai injects every `css` setting from theme `current` into `akinaiHead` as a nonce `<style>` tag (sanitized on save). Layouts do not need to print it |
| `product` | the product (same shape as the product page), looked up by slug |
| `collection` | the collection plus its first page of `products` |
| `page` | the content page |
| `link_list` | the store menu: `[{ id, label, href, isExternal }]` |
| `header`, `paragraph` | editor labels only; no value |

Values in `settings_data.json` and templates are checked against these types on upload.

`css` values may not contain `@import`, `<script`, `javascript:` URLs or CSS `expression()`. The server strips patterns that could break out of the injected `<style>` tag.

When editing **Theme settings → Custom CSS** in the theme editor, open **Markup → View output** (read-only HTML) to find selectors such as `#akinai-section-{id}` and `.akinai-section--{type}`. Use **Theme code** to edit `.edge`, layout, and CSS files; use **Template JSON** for the page structure. Edits are **drafts** until you click **Save** in the editor header, then they are baked into the theme package (and included when you download the theme). Switch to **Preview** for a visual check.

## Variables and helpers

Every template sees:

| Name | What it is |
|---|---|
| `settings` | theme settings from `config/settings_schema.json` |
| `store` | store settings: `storeName`, `locale`, currency, logo, … |
| `menu`, `policies`, `market`, `plugins` | storefront navigation, policy links, the current market, installed plugins |
| `template` | `{ name, type, suffix }` |
| `request` | `{ path, url }` |
| `currentYear` | the current year |
| `home` | home page only: `{ collections: [{ title, slug, products }], vendors }` |
| `product` | product page only: `{ id, title, slug, vendor, description, images, options, variants }` |
| `collection`, `collectionProducts` | collection page only. Products are in `collectionProducts.data` |
| `page` | content page only: `{ title, body }` |
| `section` | inside a section: `{ id, type, settings, blocks }` |

Product cards (in `home`, collections and `collectionProducts`) have `id`, `title`, `slug`, `imageUrl`, `variantId`, `vendor`, `label`, `price` and `compareAtPrice`. Prices are numbers; format them with `money()`.

| Helper | Use |
|---|---|
| `assetUrl('base.css')` | URL of a file in `assets/` (cached forever; the URL changes with each upload) |
| `imageUrl(value)` | URL for an `image_picker` value or a stored image key |
| `money(amount)` | price in the shopper's market currency |
| `t('header.cart', { count: 2 })` | string from `locales/en.default.json`; `{{ count }}` placeholders are filled in |
| `route('storefront.products.show', { slug })` | URL of an app route |
| `renderSection('header')` | renders a static section from `settings_data.json` (layout only; `await` it) |
| `pluginSlot('home.hero', fallbackHtml)` | a plugin slot; see below |
| `island('cart_button', props, fallbackHtml)` | a React island; see below |

## Plugins and islands

Themes are server-rendered HTML, so interactive parts are **islands**: small React components mounted into placeholders after the page loads. The theme prints the placeholder; the fallback HTML shows until React takes over (and if JavaScript is off).

`pluginSlot(name)` places a plugin slot, such as `home.hero` for the hero slideshow. If the plugin is installed it renders there; if not, the fallback (or nothing) shows. Dawn Lite has a `plugin_slot` section so staff can place slots from the template.

| Island | Props |
|---|---|
| `cart_button` | `label`. Opens the cart drawer; shows the item count in `.akinai-cart-count` |
| `add_to_cart` | `variantId`, `price`, `title`, `imageUrl`, `slug`, `vendor`, `productId`, `label`, `soldOutLabel`, `available`, `class` |

Build the props with `@let` so the object literal stays out of the mustache:

```edge
@let(cartProps = { variantId: variant.id, price: variant.price, title: product.title, label: t('products.add_to_cart') })
{{{ island('add_to_cart', cartProps) }}}
```

Checkout, account and the other app pages always use the built-in theme.

## Preview and publishing

- **Preview** opens the storefront with the theme for your browser session only; a bar at the top shows what you are previewing. Customers keep seeing the live theme.
- **Share preview** makes a link anyone can open for 14 days, without a back-office login.
- **Publish** makes the theme live. The previous live theme stays in the library.
- **Switch back to the built-in theme** unpublishes the live theme.

If a live theme fails to render a page, the error is logged and that request falls back to the built-in theme. In preview, errors are shown instead, so problems are caught before publishing. A section that fails is left out (live) or replaced with an HTML comment (preview).

## Rules and limits

Edge templates run on the server, so uploads are checked before they are stored. Uploading needs the `themes.upload` permission; give it only to people you would trust with code on the server.

- Zips may be up to 10 MB, unpack to 30 MB, and hold 500 files. A theme may have 40 sections and 50 blocks per section.
- File names use letters, digits, `.`, `-` and `_`. Each folder only allows its own file types (see the layout above). JavaScript is never allowed; use islands.
- Templates may use these tags: `@if`, `@elseif`, `@else`, `@unless`, `@each`, `@let`, `@assign`, `@include`, `@includeIf`, `@component`, `@slot` and `@end`.
- Template code may not mention `constructor`, `__proto__`, `prototype`, `process`, `require`, `import()`, `globalThis`, `global`, `Function`, `eval`, `Reflect` or `Proxy`, or contain `../`. Plain text and escaped output (`@{{ }}`) are not checked.
- Each theme renders in its own Edge instance rooted at its own folder, so `@include` can only reach the theme's files.
- Theme pages do not get the CSP nonce, so inline `<script>` tags are blocked. Inline `style` attributes work.

Every problem in a package is listed at once on upload, for example `sections/hero.edge: the @inject tag isn't allowed in themes`.

## How it is stored

Uploaded zips go to the private Drive disk under `themes/<sha256>.zip`. Each server unpacks a theme on first use into `tmp/themes/<sha256>/` and reuses it. The folder name is the zip's hash, so several servers never need to coordinate, and an upload never changes an existing folder. Duplicates share the zip; the zip is deleted with the last theme that uses it.

## Testing a theme

Add a bundled theme to `themes/<key>/` (the folder name must match `key`) and the unit test pattern in `tests/unit/theme_package.spec.ts` shows how to check that it passes validation:

```ts
const pkg = readThemePackage(await packThemeFolder(app.makePath('themes', 'my_theme')))
```

`tests/functional/admin/admin_themes.spec.ts` covers upload, publish, rendering, preview and share links.
