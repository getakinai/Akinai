import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { randomUUID } from 'node:crypto'
import AuditLog, { type AuditAction, type AuditValue } from '#models/audit_log'
import AuditLogService from '#services/audit_log_service'

function log(
  auditableType: string,
  auditableId: string,
  action: AuditAction,
  before: Record<string, AuditValue> = {}
) {
  return {
    userId: null,
    customerId: null,
    action,
    auditableType,
    auditableId,
    auditableLabel: `${auditableType} ${action}`,
    changes: { before, after: action === 'deleted' ? null : {} },
    ipAddress: null,
  }
}

test.group('AuditLogService.paginateForProduct', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('matches the product, its variants and its deleted variants only', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const productId = randomUUID()
    const variantId = randomUUID()
    const deletedVariantId = randomUUID()
    const otherProductId = randomUUID()
    const otherVariantId = randomUUID()

    await AuditLog.createMany([
      log('Product', productId, 'updated'),
      log('ProductVariant', variantId, 'updated'),
      log('ProductVariant', deletedVariantId, 'deleted', { productId }),
      log('Product', otherProductId, 'updated'),
      log('ProductVariant', otherVariantId, 'updated'),
      log('ProductVariant', randomUUID(), 'deleted', { productId: otherProductId }),
      log('Order', productId, 'updated'),
    ])

    const page = await service.paginateForProduct(productId, [variantId])

    assert.sameMembers(
      page.all().map(({ auditableId }) => auditableId),
      [productId, variantId, deletedVariantId]
    )
    assert.equal(page.getMeta().total, 3)
  })

  test('still finds product rows when the product has no variant ids', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const productId = randomUUID()
    await AuditLog.createMany([
      log('Product', productId, 'updated'),
      log('ProductVariant', randomUUID(), 'updated'),
    ])

    const page = await service.paginateForProduct(productId, [])

    assert.deepEqual(
      page.all().map(({ auditableId }) => auditableId),
      [productId]
    )
  })

  test('applies the action filter across the product and its variants', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const productId = randomUUID()
    const variantId = randomUUID()
    await AuditLog.createMany([
      log('Product', productId, 'updated'),
      log('ProductVariant', variantId, 'updated'),
      log('ProductVariant', randomUUID(), 'deleted', { productId }),
    ])

    const page = await service.paginateForProduct(productId, [variantId], { action: 'deleted' })

    assert.deepEqual(
      page.all().map(({ action }) => action),
      ['deleted']
    )
  })
})
