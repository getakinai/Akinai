import { useMemo, useState } from 'react'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, Checkbox, SearchInput, Skeleton } from '~/components/ui'
import { countryName } from '~/lib/countries'
import {
  REGION_COUNTRY_CODES,
  regionCountryCode,
  regionsFor,
  type CountryRegion,
} from '~/lib/country_regions'
import { shippingExamplesFor } from '~/lib/shipping_examples'
import { cn, field } from '~/lib/styles'
import { useOperatingCountry } from '~/pages/_hooks'
import { useAdminShippingRegionOwners } from './_hooks'

type RegionPickerProps = {
  zoneId: string
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  error?: string
}

type RegionGroup = {
  name: string
  regions: { name: string; items: CountryRegion[] }[]
  codes: string[]
}

const COUNTRY_OPTIONS = REGION_COUNTRY_CODES.map((code) => ({
  value: code,
  label: countryName(code),
  searchText: `${countryName(code)} ${code}`,
}))

function groupRegions(regions: readonly CountryRegion[]): RegionGroup[] {
  const groups = new Map<string, Map<string, CountryRegion[]>>()
  for (const region of regions) {
    const byRegion = groups.get(region.group) ?? new Map<string, CountryRegion[]>()
    byRegion.set(region.region, [...(byRegion.get(region.region) ?? []), region])
    groups.set(region.group, byRegion)
  }
  return [...groups].map(([name, byRegion]) => ({
    name,
    regions: [...byRegion].map(([regionName, items]) => ({
      name: regionName,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    })),
    codes: [...byRegion.values()].flat().map(({ code }) => code),
  }))
}

const matches = (region: CountryRegion, query: string) =>
  [region.name, region.region, region.code, ...(region.aliases ?? [])].some((text) =>
    text.toLowerCase().includes(query)
  )

/**
 * Picks the regions (provinces) of one country a zone covers, grouped as
 * the country's catalog groups them. Starts on the store's country of
 * operation when it has a catalog. Regions another zone covers are shown
 * but can't be picked.
 */
export default function RegionPicker({
  zoneId,
  values,
  onChange,
  disabled = false,
  error,
}: RegionPickerProps) {
  const operatingCountry = useOperatingCountry()
  const examples = shippingExamplesFor(operatingCountry)
  const [pickedCountry, setCountryCode] = useState<string | null>(() =>
    values[0] ? regionCountryCode(values[0]) : null
  )
  const countryCode =
    pickedCountry ??
    (operatingCountry && REGION_COUNTRY_CODES.includes(operatingCountry)
      ? operatingCountry
      : (REGION_COUNTRY_CODES[0] ?? ''))
  const [search, setSearch] = useState('')
  const owners = useAdminShippingRegionOwners()

  const takenBy = useMemo(
    () =>
      new Map(
        (owners.data ?? [])
          .filter((owner) => owner.zoneId !== zoneId)
          .map((owner) => [owner.regionCode, owner.zoneName])
      ),
    [owners.data, zoneId]
  )
  const selected = new Set(values)
  const query = search.trim().toLowerCase()
  const groups = useMemo(() => {
    const regions = regionsFor(countryCode).filter((region) => !query || matches(region, query))
    return groupRegions(regions)
  }, [countryCode, query])

  const countrySelected = values.filter((code) => regionCountryCode(code) === countryCode).length
  const countryTotal = regionsFor(countryCode).length

  function setMany(codes: string[], checked: boolean) {
    const available = codes.filter((code) => !takenBy.has(code))
    if (checked) {
      onChange([...values, ...available.filter((code) => !selected.has(code))])
    } else {
      const removing = new Set(available)
      onChange(values.filter((code) => !removing.has(code)))
    }
  }

  return (
    <div className={field.wrapper}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormSelectWithSearch
          name="regionCountry"
          label="Country"
          options={COUNTRY_OPTIONS}
          value={countryCode}
          disabled={disabled}
          onChange={(value) => {
            setCountryCode(value)
            setSearch('')
          }}
        />
        <div className={field.wrapper}>
          <span className={field.label} aria-hidden="true">
            Find a province
          </span>
          <SearchInput
            label="Find a province"
            placeholder={examples.regionSearch}
            value={search}
            onDebouncedChange={setSearch}
            delay={150}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>
          {countrySelected} of {countryTotal} in {countryName(countryCode)} selected
        </span>
        {countrySelected > 0 && !disabled && (
          <FormButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange(values.filter((code) => regionCountryCode(code) !== countryCode))
            }
          >
            Clear
          </FormButton>
        )}
      </div>

      <div
        className="max-h-[440px] overflow-y-auto rounded-card border border-line-2"
        aria-busy={owners.isLoading}
      >
        {owners.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : groups.length === 0 ? (
          <p className="p-4 text-[13px] text-muted">No provinces match “{search}”.</p>
        ) : (
          groups.map((group) => {
            const available = group.codes.filter((code) => !takenBy.has(code))
            const picked = available.filter((code) => selected.has(code)).length
            return (
              <fieldset key={group.name} className="border-b border-line last:border-b-0">
                <legend className="sr-only">{group.name}</legend>
                <label
                  className={cn(
                    'sticky top-0 z-[1] flex cursor-pointer items-center gap-2.5 bg-paper px-4 py-2.5',
                    (disabled || available.length === 0) && 'cursor-not-allowed'
                  )}
                >
                  <Checkbox
                    checked={available.length > 0 && picked === available.length}
                    indeterminate={picked > 0 && picked < available.length}
                    disabled={disabled || available.length === 0}
                    onChange={(event) => setMany(group.codes, event.target.checked)}
                  />
                  <span className="text-[13.5px] font-medium text-ink">{group.name}</span>
                  <span className="ml-auto text-[12.5px] text-muted">
                    {picked}/{group.codes.length}
                  </span>
                </label>
                {group.regions.map((region) => (
                  <div key={region.name} className="px-4 pb-2">
                    <p className="pt-2 pb-1 pl-6.5 text-[11.5px] tracking-[0.04em] text-subtle uppercase">
                      {region.name}
                    </p>
                    <ul className="flex flex-col">
                      {region.items.map((item) => {
                        const owner = takenBy.get(item.code)
                        return (
                          <li key={item.code}>
                            <label
                              className={cn(
                                'flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-0 py-1',
                                (disabled || owner) && 'cursor-not-allowed text-muted'
                              )}
                            >
                              <Checkbox
                                checked={selected.has(item.code)}
                                disabled={disabled || owner !== undefined}
                                onChange={(event) => setMany([item.code], event.target.checked)}
                              />
                              <span className="min-w-0 truncate text-[13.5px]">{item.name}</span>
                              {owner && (
                                <Badge tone="neutral" className="ml-auto shrink-0">
                                  In {owner}
                                </Badge>
                              )}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </fieldset>
            )
          })
        )}
      </div>
      {owners.isError && (
        <p className={field.error}>Could not check which provinces other zones cover.</p>
      )}
      {error && <p className={field.error}>{error}</p>}
    </div>
  )
}
