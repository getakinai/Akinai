import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CollectionService, { type CreateCollectionInput } from '#services/collection_service'

/**
 * Draft example collections showing the common merchandising patterns.
 * Part of the demo store (`node ace seed:demo-store`). Safe to re-run:
 * collections whose slug already exists are skipped.
 */
const EXAMPLES: (CreateCollectionInput & { slug: string })[] = [
  {
    title: 'New Arrivals',
    slug: 'new-arrivals',
    type: 'automated',
    status: 'draft',
    description: '<p>The latest additions to the store, freshly packed and ready to send.</p>',
    sortOrder: 'created_desc',
    seoTitle: 'New Arrivals | The latest gifts and essentials',
    seoDescription: 'Discover the newest gift boxes and everyday essentials in the store.',
    rules: [{ field: 'tag', operator: 'equals', value: 'new' }],
  },
  {
    title: 'On Sale',
    slug: 'on-sale',
    type: 'automated',
    status: 'draft',
    description: '<p>Marked-down favorites. Limited stock, so send them while they last.</p>',
    sortOrder: 'best_selling',
    seoTitle: 'Sale | Gifts and essentials at reduced prices',
    seoDescription: 'Save on gift boxes, snacks and everyday essentials while stock lasts.',
    match: 'all',
    rules: [
      { field: 'compare_at_price', operator: 'is_set', value: null },
      { field: 'tag', operator: 'not_equals', value: 'exclude-from-sale' },
    ],
  },
  {
    title: 'Gifts Under 1,000',
    slug: 'gifts-under-1000',
    type: 'automated',
    status: 'draft',
    description: '<p>Thoughtful gifts that are easy on the budget.</p>',
    sortOrder: 'price_asc',
    seoTitle: 'Gifts Under 1,000 | Affordable gift ideas',
    seoDescription:
      'Affordable gift ideas under 1,000 for birthdays, holidays and just-because surprises.',
    rules: [{ field: 'variant_price', operator: 'less_than', value: '1000' }],
  },
  {
    title: 'Gift Bundles',
    slug: 'gift-bundles',
    type: 'manual',
    status: 'draft',
    description: '<p>Hand-picked bundles put together by our team for every occasion.</p>',
    sortOrder: 'manual',
    seoTitle: 'Gift Bundles | Curated care packages',
    seoDescription: 'Curated gift bundles and care packages for every occasion.',
  },
]

export default class ExampleCollectionSeeder extends BaseSeeder {
  async run() {
    const collectionService = await app.container.make(CollectionService)

    for (const example of EXAMPLES) {
      if (await collectionService.findBySlug(example.slug)) continue
      await collectionService.create(example)
    }
  }
}
