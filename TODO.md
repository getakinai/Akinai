# TODO

Gaps compared with Shopify. Tick items off as they ship.

## High priority

- [x] **Order notification emails**: order confirmation, shipping confirmation with tracking link, cancellation and refund notices, staff new-order alert, bank transfer instructions and payment received.
- [x] **Refunds and order cancellation**: full and partial refunds through Stripe, restock option, shipping refund, cancel with a reason, `refunded` / `partially_refunded` payment status.
- [x] **Returns**: customer return request from the account area; staff approve, receive and restock in the admin.
- [x] **Real dashboard**: replace `inertia/pages/admin/dashboard/_mock_data.ts` with live sales, orders, average order value and top products for a date range.
- [ ] **Server-side cart and abandoned checkouts**: saved cart for signed-in customers, abandoned checkouts list in the admin, recovery emails.
- [x] **Store policy pages**: refund, privacy, terms and shipping policies editable in the admin and linked in the checkout footer.

## Medium priority

- [x] **Product SEO**: `seo_title` / `seo_description` on products, `sitemap.xml`, `robots.txt`, JSON-LD product data, Open Graph tags, canonical tags on every page.
- [ ] **More discount types**: free shipping, buy X get Y, limit to products / collections / customers, rules for combining discounts.
- [x] **Storefront collection filters**: price range, vendor, product type, option values (size, color), in stock only.
- [ ] **Inventory history**: reason for every stock change, transfers between locations, low-stock alerts.
- [x] **Customer marketing**: marketing consent at checkout and signup, newsletter signup, customer tags and notes, saved segments.
- [x] **CSV import and export**: products, customers and orders.

## Low priority

- [x] **Order timeline**: staff comments on orders, order tags.
- [x] **Packing slips and invoices**: invoice and payment receipt PDFs on the admin, account and thank-you order pages (attached to the confirmation and payment received emails); packing slip PDF in the admin.
- [x] **Shipping improvements**: weight-based rates, carrier rate lookups, shipping labels.
- [ ] **Cookie consent banner**: needed when selling to the EU.
- [ ] **Outgoing webhooks and public API**: for shipping, accounting and email marketing tools.

## Good to have

- [ ] **Gift cards**: sell, redeem at checkout, track balances.
- [x] **Wishlists**: customers save products to their account (heart on product cards and the product page, Wishlist page at `/account/wishlist`).
- [x] **Custom fields (metafields)**: on products, collections, customers and orders. Products are done as staff-managed labels (New, Hot, Trending…) at `/admin/product-labels`, picked on the product form and shown over the cover photo in the store; collections, customers and orders are still missing.
- [x] **Content pages and blog**: About, FAQ, articles. Content pages are done (admin Pages CMS at `/admin/pages`, public `/pages/:slug`, linkable from the menu, hero slides and promo banners); the blog is still missing.
- [ ] **Translations**: storefront in multiple languages per market.