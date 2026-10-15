import { test } from '@japa/runner'
import Order from '#models/order'
import PaymentMethodRepository from '#repositories/payment_method_repository'
import PoliGatewayService, {
  PoliError,
  poliPaymentMatchesOrder,
  tokenFromNavigateUrl,
  type PoliCredentials,
  type PoliResponse,
} from '#services/poli_gateway_service'

const URLS = {
  homepageUrl: 'https://shop.test',
  successUrl: 'https://shop.test/checkout/orders/1/poli-return?status=success',
  failureUrl: 'https://shop.test/checkout/orders/1/poli-return?status=failure',
  cancellationUrl: 'https://shop.test/checkout/orders/1/poli-return?status=cancelled',
  notificationUrl: 'https://shop.test/poli/nudge',
}

type Call = { method: string; path: string; body?: Record<string, unknown> }

class StubPoliGateway extends PoliGatewayService {
  calls: Call[] = []
  responses: (PoliResponse | Error)[] = []
  configured = true

  constructor() {
    super(new PaymentMethodRepository())
  }

  async credentials(): Promise<PoliCredentials | null> {
    return this.configured
      ? { mode: 'test', merchantCode: 'SS6100', authenticationCode: 'auth-code' }
      : null
  }

  protected async request(
    _credentials: PoliCredentials,
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<PoliResponse> {
    this.calls.push({ method, path, body })
    const next = this.responses.shift()
    if (!next) throw new Error('No stubbed POLi response')
    if (next instanceof Error) throw next
    return next
  }
}

function order(overrides: Partial<Pick<Order, 'total' | 'currencyCode'>> = {}) {
  const record = new Order()
  record.id = '0190f5a0-0000-7000-8000-000000000001'
  record.total = overrides.total ?? 49.95
  record.currencyCode = overrides.currencyCode ?? 'NZD'
  return record
}

test.group('PoliGatewayService: initiate', () => {
  test('starts a transaction for the order total and reads the token', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({
      status: 200,
      body: {
        Success: true,
        NavigateURL: 'https://txn.uat3.paywithpoli.com/?Token=Abc123%2B%2F%3D',
        TransactionRefNo: '996406268261',
      },
    })

    const result = await gateway.initiate(order(), URLS)

    assert.equal(result.token, 'Abc123+/=')
    assert.equal(result.navigateUrl, 'https://txn.uat3.paywithpoli.com/?Token=Abc123%2B%2F%3D')
    assert.deepEqual(gateway.calls[0], {
      method: 'POST',
      path: 'Transaction/Initiate',
      body: {
        Amount: 49.95,
        CurrencyCode: 'NZD',
        MerchantReference: '0190f5a0-0000-7000-8000-000000000001',
        MerchantHomepageURL: URLS.homepageUrl,
        SuccessURL: URLS.successUrl,
        FailureURL: URLS.failureUrl,
        CancellationURL: URLS.cancellationUrl,
        NotificationURL: URLS.notificationUrl,
      },
    })
  })

  test('fails when POLi does not accept the transaction', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({
      status: 200,
      body: { Success: false, ErrorCode: 14050, ErrorMessage: 'Invalid merchant' },
    })

    await assert.rejects(() => gateway.initiate(order(), URLS), PoliError)
  })

  test('fails when the payment URL has no token', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({
      status: 200,
      body: { Success: true, NavigateURL: 'https://txn.uat3.paywithpoli.com/' },
    })

    await assert.rejects(() => gateway.initiate(order(), URLS), PoliError)
  })

  test('fails when POLi is not set up', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.configured = false

    await assert.rejects(() => gateway.initiate(order(), URLS), PoliError)
    assert.lengthOf(gateway.calls, 0)
  })

  test('passes network errors on', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push(new PoliError('Could not reach POLi'))

    await assert.rejects(() => gateway.initiate(order(), URLS), PoliError)
  })
})

test.group('PoliGatewayService: getTransaction', () => {
  test('a completed transaction is paid', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({
      status: 200,
      body: {
        TransactionStatusCode: 'Completed',
        MerchantReference: 'order-1',
        AmountPaid: 49.95,
        CurrencyCode: 'NZD',
      },
    })

    const result = await gateway.getTransaction('Abc+/=')

    assert.deepEqual(result, {
      status: 'Completed',
      paid: true,
      merchantReference: 'order-1',
      amountPaid: 4995,
      currency: 'NZD',
    })
    assert.equal(gateway.calls[0].path, 'Transaction/GetTransaction?token=Abc%2B%2F%3D')
    assert.equal(gateway.calls[0].method, 'GET')
  })

  test('an unverified receipt is not paid', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({
      status: 200,
      body: {
        TransactionStatusCode: 'ReceiptUnverified',
        MerchantReference: 'order-1',
        AmountPaid: '49.95',
        CurrencyCode: 'NZD',
      },
    })

    const result = await gateway.getTransaction('token')

    assert.isFalse(result.paid)
    assert.equal(result.status, 'ReceiptUnverified')
    assert.equal(result.amountPaid, 4995)
  })

  test('a failed lookup fails closed', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({ status: 401, body: { ErrorCode: 1, ErrorMessage: 'Unauthorised' } })

    await assert.rejects(() => gateway.getTransaction('token'), PoliError)
  })

  test('a response without a status fails closed', async ({ assert }) => {
    const gateway = new StubPoliGateway()
    gateway.responses.push({ status: 200, body: null })

    await assert.rejects(() => gateway.getTransaction('token'), PoliError)
  })
})

test.group('PoliGatewayService: helpers', () => {
  test('reads the token from the payment URL', ({ assert }) => {
    assert.equal(tokenFromNavigateUrl('https://txn.apac.paywithpoli.com/?Token=xyz'), 'xyz')
    assert.equal(tokenFromNavigateUrl('https://txn.apac.paywithpoli.com/?token=xyz'), 'xyz')
    assert.isNull(tokenFromNavigateUrl('not a url'))
    assert.isNull(tokenFromNavigateUrl('https://txn.apac.paywithpoli.com/'))
  })

  test('a payment only matches the exact total and currency', ({ assert }) => {
    const paid = {
      status: 'Completed',
      paid: true,
      merchantReference: 'order-1',
      amountPaid: 4995,
      currency: 'nzd',
    }
    assert.isTrue(poliPaymentMatchesOrder(paid, order()))
    assert.isFalse(poliPaymentMatchesOrder({ ...paid, amountPaid: 4994 }, order()))
    assert.isFalse(poliPaymentMatchesOrder({ ...paid, amountPaid: 499500 }, order()))
    assert.isFalse(poliPaymentMatchesOrder({ ...paid, amountPaid: null }, order()))
    assert.isFalse(poliPaymentMatchesOrder({ ...paid, currency: 'AUD' }, order()))
  })
})
