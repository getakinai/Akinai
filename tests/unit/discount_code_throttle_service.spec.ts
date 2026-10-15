import { test } from '@japa/runner'
import limiter from '@adonisjs/limiter/services/main'
import { errors } from '@vinejs/vine'
import DiscountCodeThrottleService from '#services/discount_code_throttle_service'

function rejected(field = 'discountCode') {
  return () =>
    Promise.reject(new errors.E_VALIDATION_ERROR([{ field, message: 'Nope', rule: 'test' }]))
}

async function fieldOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return error.messages[0] as { field: string; message: string }
    }
    throw error
  }
  return null
}

test.group('DiscountCodeThrottleService', (group) => {
  group.each.setup(() => limiter.clear(['memory']))

  test('returns the result of the check', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()

    const value = await service.guard('10.0.0.1', async () => 'quoted')

    assert.equal(value, 'quoted')
  })

  test('rethrows a rejected code', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()

    const error = await fieldOf(service.guard('10.0.0.1', rejected()))

    assert.deepEqual(error, { field: 'discountCode', message: 'Nope', rule: 'test' })
  })

  test('blocks the IP after 10 rejected codes', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()
    for (let attempt = 0; attempt < 10; attempt++) {
      await fieldOf(service.guard('10.0.0.1', rejected()))
    }

    let ran = false
    const error = await fieldOf(
      service.guard('10.0.0.1', async () => {
        ran = true
      })
    )

    assert.isFalse(ran)
    assert.equal(error?.field, 'discountCode')
    assert.match(error!.message, /Too many attempts/)
  })

  test('errors on other fields do not count', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()
    for (let attempt = 0; attempt < 12; attempt++) {
      await fieldOf(service.guard('10.0.0.1', rejected('shippingRateId')))
    }

    const value = await service.guard('10.0.0.1', async () => 'quoted')

    assert.equal(value, 'quoted')
  })

  test('other errors are rethrown without counting', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()
    for (let attempt = 0; attempt < 12; attempt++) {
      await assert.rejects(
        () => service.guard('10.0.0.1', () => Promise.reject(new Error('boom'))),
        'boom'
      )
    }

    assert.equal(await service.guard('10.0.0.1', async () => 'quoted'), 'quoted')
  })

  test('each IP has its own count', async ({ assert }) => {
    const service = new DiscountCodeThrottleService()
    for (let attempt = 0; attempt < 10; attempt++) {
      await fieldOf(service.guard('10.0.0.1', rejected()))
    }

    const value = await service.guard('10.0.0.2', async () => 'quoted')

    assert.equal(value, 'quoted')
  })
})
