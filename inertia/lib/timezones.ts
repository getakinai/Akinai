type LocationOptions = {
  countries: { code: string; timezones: string[] }[]
  timezones: string[]
}

/** The timezones of the chosen country, or every timezone when it is not in the list. */
export function countryTimezones(
  options: LocationOptions | undefined,
  countryCode: string
): string[] {
  if (!options) return []
  return options.countries.find(({ code }) => code === countryCode)?.timezones ?? options.timezones
}

/**
 * The timezone to select from a country's list: the current one when it is
 * in the list, else the browser's, else the only one, else none ('').
 */
export function pickTimezone(timezones: string[], current: string): string {
  if (current && timezones.includes(current)) return current
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (detected && timezones.includes(detected)) return detected
  return timezones.length === 1 ? timezones[0] : ''
}

/** Select options for timezones, keeping a saved value that is outside the list. */
export function timezoneSelectOptions(timezones: string[], current: string) {
  const list = current && !timezones.includes(current) ? [current, ...timezones] : timezones
  return list.map((zone) => ({ value: zone, label: zone.replaceAll('_', ' '), searchText: zone }))
}
