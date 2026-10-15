export type CountryRegion = {
  /** ISO 3166-2 code, e.g. `PH-CEB`. */
  code: string
  name: string
  /** Island group used to group regions in pickers, e.g. Visayas. */
  group: string
  /** Administrative region, e.g. Central Visayas. */
  region: string
  /** Other names address lookups may return for it. */
  aliases?: readonly string[]
}

/**
 * Provinces (and Metro Manila) of the Philippines. Keep in sync with
 * `inertia/lib/country_regions.ts`.
 */
const PH_REGIONS: readonly CountryRegion[] = [
  {
    code: 'PH-00',
    name: 'Metro Manila',
    group: 'Luzon',
    region: 'National Capital Region',
    aliases: ['NCR', 'National Capital Region', 'Manila', 'Kalakhang Maynila'],
  },
  { code: 'PH-ABR', name: 'Abra', group: 'Luzon', region: 'Cordillera' },
  { code: 'PH-APA', name: 'Apayao', group: 'Luzon', region: 'Cordillera' },
  { code: 'PH-BEN', name: 'Benguet', group: 'Luzon', region: 'Cordillera' },
  { code: 'PH-IFU', name: 'Ifugao', group: 'Luzon', region: 'Cordillera' },
  { code: 'PH-KAL', name: 'Kalinga', group: 'Luzon', region: 'Cordillera' },
  {
    code: 'PH-MOU',
    name: 'Mountain Province',
    group: 'Luzon',
    region: 'Cordillera',
    aliases: ['Mt. Province', 'Mt Province'],
  },
  { code: 'PH-ILN', name: 'Ilocos Norte', group: 'Luzon', region: 'Ilocos' },
  { code: 'PH-ILS', name: 'Ilocos Sur', group: 'Luzon', region: 'Ilocos' },
  { code: 'PH-LUN', name: 'La Union', group: 'Luzon', region: 'Ilocos' },
  { code: 'PH-PAN', name: 'Pangasinan', group: 'Luzon', region: 'Ilocos' },
  { code: 'PH-BTN', name: 'Batanes', group: 'Luzon', region: 'Cagayan Valley' },
  { code: 'PH-CAG', name: 'Cagayan', group: 'Luzon', region: 'Cagayan Valley' },
  { code: 'PH-ISA', name: 'Isabela', group: 'Luzon', region: 'Cagayan Valley' },
  { code: 'PH-NUV', name: 'Nueva Vizcaya', group: 'Luzon', region: 'Cagayan Valley' },
  { code: 'PH-QUI', name: 'Quirino', group: 'Luzon', region: 'Cagayan Valley' },
  { code: 'PH-AUR', name: 'Aurora', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-BAN', name: 'Bataan', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-BUL', name: 'Bulacan', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-NUE', name: 'Nueva Ecija', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-PAM', name: 'Pampanga', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-TAR', name: 'Tarlac', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-ZMB', name: 'Zambales', group: 'Luzon', region: 'Central Luzon' },
  { code: 'PH-BTG', name: 'Batangas', group: 'Luzon', region: 'Calabarzon' },
  { code: 'PH-CAV', name: 'Cavite', group: 'Luzon', region: 'Calabarzon' },
  { code: 'PH-LAG', name: 'Laguna', group: 'Luzon', region: 'Calabarzon' },
  { code: 'PH-QUE', name: 'Quezon', group: 'Luzon', region: 'Calabarzon' },
  { code: 'PH-RIZ', name: 'Rizal', group: 'Luzon', region: 'Calabarzon' },
  { code: 'PH-MAD', name: 'Marinduque', group: 'Luzon', region: 'Mimaropa' },
  { code: 'PH-MDC', name: 'Occidental Mindoro', group: 'Luzon', region: 'Mimaropa' },
  { code: 'PH-MDR', name: 'Oriental Mindoro', group: 'Luzon', region: 'Mimaropa' },
  { code: 'PH-PLW', name: 'Palawan', group: 'Luzon', region: 'Mimaropa' },
  { code: 'PH-ROM', name: 'Romblon', group: 'Luzon', region: 'Mimaropa' },
  { code: 'PH-ALB', name: 'Albay', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-CAN', name: 'Camarines Norte', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-CAS', name: 'Camarines Sur', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-CAT', name: 'Catanduanes', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-MAS', name: 'Masbate', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-SOR', name: 'Sorsogon', group: 'Luzon', region: 'Bicol' },
  { code: 'PH-AKL', name: 'Aklan', group: 'Visayas', region: 'Western Visayas' },
  { code: 'PH-ANT', name: 'Antique', group: 'Visayas', region: 'Western Visayas' },
  { code: 'PH-CAP', name: 'Capiz', group: 'Visayas', region: 'Western Visayas' },
  { code: 'PH-GUI', name: 'Guimaras', group: 'Visayas', region: 'Western Visayas' },
  { code: 'PH-ILI', name: 'Iloilo', group: 'Visayas', region: 'Western Visayas' },
  { code: 'PH-NEC', name: 'Negros Occidental', group: 'Visayas', region: 'Negros Island' },
  { code: 'PH-NER', name: 'Negros Oriental', group: 'Visayas', region: 'Negros Island' },
  { code: 'PH-SIG', name: 'Siquijor', group: 'Visayas', region: 'Negros Island' },
  { code: 'PH-BOH', name: 'Bohol', group: 'Visayas', region: 'Central Visayas' },
  { code: 'PH-CEB', name: 'Cebu', group: 'Visayas', region: 'Central Visayas' },
  { code: 'PH-BIL', name: 'Biliran', group: 'Visayas', region: 'Eastern Visayas' },
  { code: 'PH-EAS', name: 'Eastern Samar', group: 'Visayas', region: 'Eastern Visayas' },
  { code: 'PH-LEY', name: 'Leyte', group: 'Visayas', region: 'Eastern Visayas' },
  { code: 'PH-NSA', name: 'Northern Samar', group: 'Visayas', region: 'Eastern Visayas' },
  {
    code: 'PH-WSA',
    name: 'Samar',
    group: 'Visayas',
    region: 'Eastern Visayas',
    aliases: ['Western Samar'],
  },
  { code: 'PH-SLE', name: 'Southern Leyte', group: 'Visayas', region: 'Eastern Visayas' },
  {
    code: 'PH-ZAN',
    name: 'Zamboanga del Norte',
    group: 'Mindanao',
    region: 'Zamboanga Peninsula',
  },
  { code: 'PH-ZAS', name: 'Zamboanga del Sur', group: 'Mindanao', region: 'Zamboanga Peninsula' },
  {
    code: 'PH-ZSI',
    name: 'Zamboanga Sibugay',
    group: 'Mindanao',
    region: 'Zamboanga Peninsula',
  },
  { code: 'PH-BUK', name: 'Bukidnon', group: 'Mindanao', region: 'Northern Mindanao' },
  { code: 'PH-CAM', name: 'Camiguin', group: 'Mindanao', region: 'Northern Mindanao' },
  { code: 'PH-LAN', name: 'Lanao del Norte', group: 'Mindanao', region: 'Northern Mindanao' },
  { code: 'PH-MSC', name: 'Misamis Occidental', group: 'Mindanao', region: 'Northern Mindanao' },
  { code: 'PH-MSR', name: 'Misamis Oriental', group: 'Mindanao', region: 'Northern Mindanao' },
  {
    code: 'PH-COM',
    name: 'Davao de Oro',
    group: 'Mindanao',
    region: 'Davao',
    aliases: ['Compostela Valley'],
  },
  { code: 'PH-DAV', name: 'Davao del Norte', group: 'Mindanao', region: 'Davao' },
  { code: 'PH-DAS', name: 'Davao del Sur', group: 'Mindanao', region: 'Davao' },
  { code: 'PH-DVO', name: 'Davao Occidental', group: 'Mindanao', region: 'Davao' },
  { code: 'PH-DAO', name: 'Davao Oriental', group: 'Mindanao', region: 'Davao' },
  {
    code: 'PH-NCO',
    name: 'Cotabato',
    group: 'Mindanao',
    region: 'Soccsksargen',
    aliases: ['North Cotabato'],
  },
  { code: 'PH-SAR', name: 'Sarangani', group: 'Mindanao', region: 'Soccsksargen' },
  { code: 'PH-SCO', name: 'South Cotabato', group: 'Mindanao', region: 'Soccsksargen' },
  { code: 'PH-SUK', name: 'Sultan Kudarat', group: 'Mindanao', region: 'Soccsksargen' },
  { code: 'PH-AGN', name: 'Agusan del Norte', group: 'Mindanao', region: 'Caraga' },
  { code: 'PH-AGS', name: 'Agusan del Sur', group: 'Mindanao', region: 'Caraga' },
  { code: 'PH-DIN', name: 'Dinagat Islands', group: 'Mindanao', region: 'Caraga' },
  { code: 'PH-SUN', name: 'Surigao del Norte', group: 'Mindanao', region: 'Caraga' },
  { code: 'PH-SUR', name: 'Surigao del Sur', group: 'Mindanao', region: 'Caraga' },
  { code: 'PH-BAS', name: 'Basilan', group: 'Mindanao', region: 'Bangsamoro' },
  { code: 'PH-LAS', name: 'Lanao del Sur', group: 'Mindanao', region: 'Bangsamoro' },
  { code: 'PH-MGN', name: 'Maguindanao del Norte', group: 'Mindanao', region: 'Bangsamoro' },
  { code: 'PH-MGS', name: 'Maguindanao del Sur', group: 'Mindanao', region: 'Bangsamoro' },
  { code: 'PH-SLU', name: 'Sulu', group: 'Mindanao', region: 'Bangsamoro' },
  { code: 'PH-TAW', name: 'Tawi-Tawi', group: 'Mindanao', region: 'Bangsamoro' },
]

/** Countries whose addresses pick a region from a list, by country code. */
export const COUNTRY_REGIONS: Readonly<Record<string, readonly CountryRegion[]>> = {
  PH: PH_REGIONS,
}

export const REGION_COUNTRY_CODES: readonly string[] = Object.keys(COUNTRY_REGIONS)

export const REGION_CODES: readonly string[] = Object.values(COUNTRY_REGIONS).flatMap((regions) =>
  regions.map(({ code }) => code)
)

const regionsByCode = new Map(
  Object.values(COUNTRY_REGIONS).flatMap((regions) =>
    regions.map((region) => [region.code, region])
  )
)

export function regionsFor(countryCode: string): readonly CountryRegion[] {
  return COUNTRY_REGIONS[countryCode.toUpperCase()] ?? []
}

export function hasRegions(countryCode: string): boolean {
  return regionsFor(countryCode).length > 0
}

/** The region's country code, taken from its ISO 3166-2 prefix. */
export function regionCountryCode(code: string): string {
  return code.slice(0, 2).toUpperCase()
}

export function findRegion(countryCode: string, code: string | null | undefined) {
  if (!code) return null
  const region = regionsByCode.get(code.trim().toUpperCase())
  return region && regionCountryCode(region.code) === countryCode.toUpperCase() ? region : null
}

export function regionName(code: string): string {
  return regionsByCode.get(code)?.name ?? code
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bprovince of\b|\bprovince\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * The region whose name, code or alias matches `name` (case, accents and a
 * "Province" suffix ignored), e.g. what address autocomplete returns.
 */
export function matchRegionByName(countryCode: string, name: string | null | undefined) {
  if (!name?.trim()) return null
  const byCode = findRegion(countryCode, name)
  if (byCode) return byCode

  const wanted = normalize(name)
  if (!wanted) return null
  return (
    regionsFor(countryCode).find(
      (region) =>
        normalize(region.name) === wanted ||
        region.aliases?.some((alias) => normalize(alias) === wanted)
    ) ?? null
  )
}
