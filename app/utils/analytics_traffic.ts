import type { AnalyticsDeviceType, AnalyticsSource } from '#constants/analytics'

const BOT_PATTERN =
  /bot|crawl|spider|slurp|scrape|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|java\/|httpclient|okhttp|go-http/i

const TABLET_PATTERN = /ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i
const MOBILE_PATTERN = /mobi|iphone|ipod|android|windows phone|blackberry|opera mini/i

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'yahoo.',
  'duckduckgo.com',
  'baidu.com',
  'yandex.',
  'ecosia.org',
  'search.brave.com',
]
const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  't.co',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'pinterest.',
  'linkedin.com',
  'lnkd.in',
  'reddit.com',
  'youtube.com',
  'threads.net',
  'messenger.com',
  'whatsapp.com',
]
const EMAIL_HOSTS = ['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'mail.yahoo.']

const PAID_MEDIUMS = [
  'cpc',
  'ppc',
  'paid',
  'paidsearch',
  'paid_search',
  'paid_social',
  'cpm',
  'display',
]
const SOCIAL_MEDIUMS = ['social', 'social-network', 'social_media', 'sm']
const EMAIL_MEDIUMS = ['email', 'e-mail', 'newsletter']

export function isBotUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true
  return BOT_PATTERN.test(userAgent)
}

export function deviceTypeFor(userAgent: string | undefined): AnalyticsDeviceType {
  if (!userAgent) return 'desktop'
  if (TABLET_PATTERN.test(userAgent)) return 'tablet'
  if (MOBILE_PATTERN.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** Host of a referrer URL, lowercased and without `www.`; null when it isn't an http(s) URL. */
export function referrerHostOf(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return (
      url.hostname
        .toLowerCase()
        .replace(/^www\./, '')
        .slice(0, 255) || null
    )
  } catch {
    return null
  }
}

const matchesHost = (host: string, list: string[]) =>
  list.some((entry) =>
    entry.endsWith('.') ? host.includes(entry) : host === entry || host.endsWith(`.${entry}`)
  )

export type TrafficInput = {
  referrerHost: string | null
  storeHost: string | null
  utmSource?: string | null
  utmMedium?: string | null
  hasClickId?: boolean
}

/**
 * Where a session came from. UTM tags and ad click ids win over the
 * referrer; a referrer on the store's own host counts as direct.
 */
export function trafficSourceFor(input: TrafficInput): AnalyticsSource {
  const medium = input.utmMedium?.trim().toLowerCase() ?? ''
  if (input.hasClickId || PAID_MEDIUMS.includes(medium)) return 'paid'
  if (EMAIL_MEDIUMS.includes(medium)) return 'email'
  if (SOCIAL_MEDIUMS.includes(medium)) return 'social'

  const host = input.referrerHost
  if (!host || (input.storeHost && host === input.storeHost)) {
    return input.utmSource ? 'referral' : 'direct'
  }
  if (matchesHost(host, EMAIL_HOSTS)) return 'email'
  if (matchesHost(host, SEARCH_HOSTS)) return 'search'
  if (matchesHost(host, SOCIAL_HOSTS)) return 'social'
  return 'referral'
}
