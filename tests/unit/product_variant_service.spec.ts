import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as vineErrors } from '@vinejs/vine'
import ProductVariant from '#models/product_variant'
import ProductService from '#services/product_service'
import ProductVariantService from '#services/product_variant_service'
import {
  ensureCatalogOptions,
  sizeAndColorOptions,
  sizeOnlyOptions,
} from '#tests/helpers/catalog_options'

const fields = {
  sku: null,
  barcode: null,
  price: 20,
  compareAtPrice: null,
  trackInventory: false,
}

async function setup(
  buildOptions: (catalog: Awaited<ReturnType<typeof ensureCatalogOptions>>) => {
    optionDefinitionId: string
    optionDefinitionValueIds: string[]
  }[] = (catalog) => sizeOnlyOptions(catalog, ['S', 'M', 'L'])
) {
  const productService = await app.container.make(ProductService)
  const variantService = await app.container.make(ProductVariantService)
  const catalog = await ensureCatalogOptions()
  const created = await productService.create({
    title: 'Tee',
    description: null,
    status: 'draft',
    price: 20,
    options: buildOptions(catalog),
  })
  const product = await variantService.findProductOrFail(created.id)
  const valueIds = (optionIndex: number) => product.options[optionIndex].values.map(({ id }) => id)
  return { productService, variantService, product, valueIds, catalog }
}

async function combinationMessage(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return (error.messages as { field: string; message: string }[]).find(
        ({ field }) => field === 'optionValueIds'
      )?.message
    }
    throw error
  }
}

test.group('ProductVariantService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('creates a variant for a free combination after the last one', async ({ assert }) => {
    const { variantService, product, valueIds } = await setup((catalog) =>
      sizeAndColorOptions(catalog, ['S', 'M'], ['Red', 'Blue'])
    )
    const mediumBlue = product.variants.find(({ title }) => title === 'M / Blue')!
    await mediumBlue.delete()
    const fresh = await variantService.findProductOrFail(product.id)

    const variant = await variantService.create(fresh, {
      ...fields,
      sku: 'TEE-M-BLUE',
      optionValueIds: [valueIds(1)[1], valueIds(0)[1]],
    })

    assert.equal(variant.title, 'M / Blue')
    assert.equal(variant.productId, product.id)
    assert.equal(variant.position, 3)
    assert.equal(variant.sku, 'TEE-M-BLUE')
    assert.sameMembers(
      variant.optionValues.map(({ id }) => id),
      [valueIds(0)[1], valueIds(1)[1]]
    )
  })

  test('rejects a combination that already exists', async ({ assert }) => {
    const { variantService, product, valueIds } = await setup()

    const message = await combinationMessage(
      variantService.create(product, { ...fields, optionValueIds: [valueIds(0)[0]] })
    )

    assert.equal(message, 'S already exists')
  })

  test('rejects missing and foreign option values', async ({ assert }) => {
    const { variantService, product } = await setup((catalog) =>
      sizeAndColorOptions(catalog, ['S'], ['Red', 'Blue'])
    )
    const other = await setup()

    const missing = await combinationMessage(
      variantService.create(product, {
        ...fields,
        optionValueIds: [product.options[0].values[0].id],
      })
    )
    const foreign = await combinationMessage(
      variantService.create(product, {
        ...fields,
        optionValueIds: [
          product.options[0].values[0].id,
          product.options[1].values[1].id,
          other.valueIds(0)[0],
        ],
      })
    )

    assert.equal(missing, 'Choose one Color value')
    assert.equal(foreign, 'Choose values from this product’s options only')
  })

  test('moves a variant to a free combination and renames it', async ({ assert }) => {
    const { variantService, product, valueIds } = await setup()
    const [small, , large] = product.variants
    await large.delete()

    const variant = await variantService.findForProductOrFail(product.id, small.id)
    const updated = await variantService.update(variant, {
      ...fields,
      price: 22,
      optionValueIds: [valueIds(0)[2]],
    })

    assert.equal(updated.title, 'L')
    assert.equal(updated.price, 22)
    assert.deepEqual(
      updated.optionValues.map(({ id }) => id),
      [valueIds(0)[2]]
    )
  })

  test('updates fields without touching option values when none are given', async ({
    assert,
  }) => {
    const { variantService, product, valueIds } = await setup()
    const variant = await variantService.findForProductOrFail(product.id, product.variants[0].id)

    const updated = await variantService.update(variant, { ...fields, sku: 'TEE-S' })

    assert.equal(updated.sku, 'TEE-S')
    assert.equal(updated.title, 'S')
    assert.deepEqual(
      updated.optionValues.map(({ id }) => id),
      [valueIds(0)[0]]
    )
  })

  test('scopes lookups to the parent product', async ({ assert }) => {
    const { variantService, product } = await setup()
    const other = await setup()

    await assert.rejects(() =>
      variantService.findForProductOrFail(other.product.id, product.variants[0].id)
    )
  })

  test('deletes a variant', async ({ assert }) => {
    const { variantService, product } = await setup()
    const variant = await variantService.findForProductOrFail(product.id, product.variants[1].id)

    await variantService.delete(variant)

    assert.isNull(await ProductVariant.find(variant.id))
  })
})
