import { readFile } from 'node:fs/promises'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import {
  REGION_CODES,
  REGION_COUNTRY_CODES,
  findRegion,
  hasRegions,
  matchRegionByName,
  regionCountryCode,
  regionName,
  regionsFor,
} from '#constants/country_regions'

const catalogBlock = (source: string) => source.match(/const PH_REGIONS[\s\S]*?\n\]\n/)?.[0]

test.group('Country regions catalog', () => {
  test('lists Metro Manila and the 82 provinces of the Philippines', ({ assert }) => {
    const regions = regionsFor('ph')

    assert.lengthOf(regions, 83)
    assert.deepEqual(REGION_COUNTRY_CODES, ['PH'])
    assert.lengthOf(new Set(regions.map(({ code }) => code)), 83)
    assert.isTrue(regions.every(({ code }) => /^PH-[0-9A-Z]{2,3}$/.test(code)))
    assert.sameMembers(
      [...new Set(regions.map(({ group }) => group))],
      ['Luzon', 'Visayas', 'Mindanao']
    )
    assert.lengthOf(REGION_CODES, 83)
  })

  test('only countries with a list have regions', ({ assert }) => {
    assert.isTrue(hasRegions('PH'))
    assert.isFalse(hasRegions('AU'))
    assert.deepEqual(regionsFor('AU'), [])
  })

  test('findRegion matches the code within its own country only', ({ assert }) => {
    assert.equal(findRegion('PH', 'ph-ceb')?.name, 'Cebu')
    assert.isNull(findRegion('AU', 'PH-CEB'))
    assert.isNull(findRegion('PH', 'PH-XXX'))
    assert.isNull(findRegion('PH', null))
  })

  test('matchRegionByName accepts names, aliases and codes loosely', ({ assert }) => {
    const code = (name: string) => matchRegionByName('PH', name)?.code ?? null

    assert.equal(code('Metro Manila'), 'PH-00')
    assert.equal(code('NCR'), 'PH-00')
    assert.equal(code('national capital region'), 'PH-00')
    assert.equal(code('Cebu Province'), 'PH-CEB')
    assert.equal(code('Province of Bohol'), 'PH-BOH')
    assert.equal(code('Compostela Valley'), 'PH-COM')
    assert.equal(code('Mt. Province'), 'PH-MOU')
    assert.equal(code('Mountain Province'), 'PH-MOU')
    assert.equal(code('tawi tawi'), 'PH-TAW')
    assert.equal(code('PH-ILI'), 'PH-ILI')
  })

  test('matchRegionByName returns null for unknown names and other countries', ({ assert }) => {
    assert.isNull(matchRegionByName('PH', 'Atlantis'))
    assert.isNull(matchRegionByName('PH', '  '))
    assert.isNull(matchRegionByName('PH', null))
    assert.isNull(matchRegionByName('AU', 'Cebu'))
  })

  test('regionCountryCode and regionName read the catalog', ({ assert }) => {
    assert.equal(regionCountryCode('ph-cav'), 'PH')
    assert.equal(regionName('PH-CAV'), 'Cavite')
    assert.equal(regionName('PH-XXX'), 'PH-XXX')
  })

  test('the frontend copy has the same regions as the backend', async ({ assert }) => {
    const [backend, frontend] = await Promise.all([
      readFile(app.makePath('app/constants/country_regions.ts'), 'utf8'),
      readFile(app.makePath('inertia/lib/country_regions.ts'), 'utf8'),
    ])

    assert.isDefined(catalogBlock(backend))
    assert.equal(catalogBlock(frontend), catalogBlock(backend))
  })
})
