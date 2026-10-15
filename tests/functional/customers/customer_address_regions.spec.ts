import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type CustomerAccount from '#models/customer_account'
import CustomerAddress from '#models/customer_address'
import { createAdminUser } from '#tests/helpers/admin'
import { createCustomerAccount } from '#tests/helpers/customers'

const PH_ADDRESS = {
  fullName: 'Juan Dela Cruz',
  company: null,
  address1: '1 Osmeña Boulevard',
  address2: null,
  city: 'Cebu City',
  province: null,
  postalCode: '6000',
  countryCode: 'ph',
  phone: null,
  isDefault: false,
}

function sendAddress(
  client: ApiClient,
  account: CustomerAccount,
  body: Record<string, unknown>,
  addressId?: string
) {
  const request = addressId
    ? client.put(`/account/addresses/${addressId}`)
    : client.post('/account/addresses')
  return request.json(body).accept('json').withCsrfToken().withGuard('customer').loginAs(account)
}

test.group('Customer addresses: provinces', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves the picked province with its catalog name', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()

    const response = await sendAddress(client, account, {
      ...PH_ADDRESS,
      province: 'whatever',
      regionCode: 'ph-ceb',
    })

    response.assertStatus(201)
    response.assertBodyContains({ data: { province: 'Cebu', regionCode: 'PH-CEB' } })
    const saved = await CustomerAddress.findOrFail(response.body().data.id)
    assert.equal(saved.regionCode, 'PH-CEB')
  })

  test('matches a typed province name', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await sendAddress(client, account, { ...PH_ADDRESS, province: 'NCR' })

    response.assertStatus(201)
    response.assertBodyContains({ data: { province: 'Metro Manila', regionCode: 'PH-00' } })
  })

  test('requires a listed province for Philippine addresses', async ({ client }) => {
    const { account } = await createCustomerAccount()

    for (const province of [null, 'Atlantis']) {
      const response = await sendAddress(client, account, { ...PH_ADDRESS, province })
      response.assertStatus(422)
      response.assertBodyContains({
        errors: [{ field: 'province', message: 'Choose a province' }],
      })
    }
  })

  test('rejects a region code that is not in the province list', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await sendAddress(client, account, {
      ...PH_ADDRESS,
      province: 'Cebu',
      regionCode: 'PH-XXX',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'regionCode' }] })
  })

  test('keeps free-text regions for other countries', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const response = await sendAddress(client, account, {
      ...PH_ADDRESS,
      city: 'Auckland',
      province: 'Auckland',
      regionCode: 'PH-CEB',
      countryCode: 'nz',
    })

    response.assertStatus(201)
    response.assertBodyContains({ data: { province: 'Auckland', regionCode: null } })
  })

  test('updating an address re-resolves its province', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const created = await sendAddress(client, account, { ...PH_ADDRESS, regionCode: 'PH-CEB' })

    const response = await sendAddress(
      client,
      account,
      { ...PH_ADDRESS, province: 'Bohol' },
      created.body().data.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ data: { province: 'Bohol', regionCode: 'PH-BOH' } })
  })

  test('staff save the province on a customer address', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { customer } = await createCustomerAccount()

    const saved = await client
      .post(`/admin/customers/${customer.id}/addresses`)
      .json({ ...PH_ADDRESS, regionCode: 'PH-00' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    saved.assertStatus(201)
    saved.assertBodyContains({ data: { province: 'Metro Manila', regionCode: 'PH-00' } })

    const rejected = await client
      .post(`/admin/customers/${customer.id}/addresses`)
      .json({ ...PH_ADDRESS, province: 'Atlantis' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    rejected.assertStatus(422)
    rejected.assertBodyContains({ errors: [{ field: 'province' }] })
  })
})
