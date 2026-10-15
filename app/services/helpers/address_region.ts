import { errors } from '@vinejs/vine'
import { findRegion, hasRegions, matchRegionByName } from '#constants/country_regions'

type RegionFields = {
  countryCode: string
  province?: string | null
  regionCode?: string | null
}

export type ResolvedRegion = {
  province: string | null
  regionCode: string | null
}

/**
 * For countries with a region list, the catalog region the address points
 * at: its `regionCode`, else a `province` matching a region name or alias.
 * `province` is replaced with the catalog name. Other countries keep their
 * free-text province and get no region code.
 */
export function resolveRegion({ countryCode, province, regionCode }: RegionFields): ResolvedRegion {
  if (!hasRegions(countryCode)) return { province: province ?? null, regionCode: null }

  const region = findRegion(countryCode, regionCode) ?? matchRegionByName(countryCode, province)
  return region
    ? { province: region.name, regionCode: region.code }
    : { province: province ?? null, regionCode: null }
}

/**
 * Like `resolveRegion`, but a country with a region list must resolve to
 * one of its regions. Reported on `field` as a validation error.
 */
export function requireRegion(address: RegionFields, field = 'province'): ResolvedRegion {
  const resolved = resolveRegion(address)
  if (hasRegions(address.countryCode) && !resolved.regionCode) {
    throw new errors.E_VALIDATION_ERROR([{ field, message: 'Choose a province', rule: 'region' }])
  }
  return resolved
}
