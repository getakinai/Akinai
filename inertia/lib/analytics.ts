import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { http } from '~/lib/http'
import { AnalyticsEventResponseSchema, type AnalyticsEventType } from '~/lib/analytics_types'

const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid']

let referrerSent = false
let queue: Promise<unknown> = Promise.resolve()

function campaignFields() {
  const params = new URLSearchParams(window.location.search)
  const value = (key: string) => params.get(key)?.trim().slice(0, 100) || undefined
  return {
    utmSource: value('utm_source'),
    utmMedium: value('utm_medium'),
    utmCampaign: value('utm_campaign'),
    hasClickId: CLICK_ID_PARAMS.some((key) => params.has(key)),
  }
}

/**
 * Sends one first-party storefront analytics event. Events go out one at a
 * time so the first one sets the session cookie before the next arrives.
 * The referrer only goes with the first event of a page load; after
 * client-side navigation it no longer describes where the visit came from.
 */
export function trackEvent(type: AnalyticsEventType, options: { productId?: string } = {}) {
  if (typeof window === 'undefined') return
  const referrer = referrerSent ? undefined : document.referrer.slice(0, 2048) || undefined
  referrerSent = true
  const body = {
    type,
    path: window.location.pathname.slice(0, 500),
    productId: options.productId,
    referrer,
    ...campaignFields(),
  }

  queue = queue.then(() =>
    http('/store/analytics/events', {
      method: 'POST',
      body,
      schema: AnalyticsEventResponseSchema,
      keepalive: true,
    }).catch((error: unknown) => {
      console.warn('Analytics event was not recorded', error)
    })
  )
}

/** Records a page view whenever the Inertia page URL changes. */
export function usePageViewTracking() {
  const { url } = usePage()
  useEffect(() => {
    trackEvent('page_view')
  }, [url])
}
