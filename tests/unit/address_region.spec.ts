import { test } from '@japa/runner'
import { errors } from '@vinejs/vine'
import { requireRegion, resolveRegion } from '#services/helpers/address_region'

test.group('Address region', () => {
  test('uses the region code and its catalog name', ({ assert }) => {
    assert.deepEqual(resolveRegion({ countryCode: 'PH', province: 'typo', regionCode: 'PH-CEB' }), {
      province: 'Cebu',
      regionCode: 'PH-CEB',
    })
  })

  test('falls back to matching the province name', ({ assert }) => {
    assert.deepEqual(resolveRegion({ countryCode: 'PH', province: 'NCR', regionCode: null }), {
      province: 'Metro Manila',
      regionCode: 'PH-00',
    })
  })

  test('ignores a region code from another country', ({ assert }) => {
    assert.deepEqual(
      resolveRegion({ countryCode: 'PH', province: 'Bohol', regionCode: 'AU-NSW' }),
      {
        province: 'Bohol',
        regionCode: 'PH-BOH',
      }
    )
    assert.deepEqual(resolveRegion({ countryCode: 'AU', province: 'NSW', regionCode: 'PH-CEB' }), {
      province: 'NSW',
      regionCode: null,
    })
  })

  test('keeps free text for countries without a region list', ({ assert }) => {
    assert.deepEqual(resolveRegion({ countryCode: 'NZ', province: 'Auckland' }), {
      province: 'Auckland',
      regionCode: null,
    })
    assert.deepEqual(resolveRegion({ countryCode: 'NZ' }), { province: null, regionCode: null })
  })

  test('leaves an unknown province unresolved', ({ assert }) => {
    assert.deepEqual(resolveRegion({ countryCode: 'PH', province: 'Atlantis' }), {
      province: 'Atlantis',
      regionCode: null,
    })
  })

  test('requireRegion rejects an unresolved province in a listed country', ({ assert }) => {
    try {
      requireRegion({ countryCode: 'PH', province: 'Atlantis' })
      assert.fail('Expected a validation error')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.deepEqual((error as InstanceType<typeof errors.E_VALIDATION_ERROR>).messages, [
        { field: 'province', message: 'Choose a province', rule: 'region' },
      ])
    }
  })

  test('requireRegion accepts listed provinces and other countries', ({ assert }) => {
    assert.equal(
      requireRegion({ countryCode: 'PH', regionCode: 'PH-DAS' }).province,
      'Davao del Sur'
    )
    assert.equal(requireRegion({ countryCode: 'AU', province: 'NSW' }).province, 'NSW')
    assert.isNull(requireRegion({ countryCode: 'AU', province: null }).regionCode)
  })
})
