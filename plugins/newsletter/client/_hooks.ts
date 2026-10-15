import { useMutation } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { recaptchaHeaders, type RecaptchaAction } from '~/lib/recaptcha'
import { NewsletterResponseSchema, type NewsletterForm } from './_types'

/**
 * Each newsletter form posts to its own route with its own bot-check action.
 * The maintenance route stays reachable while the store is down.
 */
const NEWSLETTER_ENDPOINTS = {
  footer: { url: '/newsletter', action: 'customer_newsletter' },
  maintenance: { url: '/maintenance/newsletter', action: 'maintenance_newsletter' },
} as const satisfies Record<string, { url: string; action: RecaptchaAction }>

export type NewsletterSource = keyof typeof NEWSLETTER_ENDPOINTS

export async function subscribeNewsletter(
  payload: NewsletterForm,
  source: NewsletterSource = 'footer'
) {
  const { url, action } = NEWSLETTER_ENDPOINTS[source]
  return http(url, {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders(action),
    schema: NewsletterResponseSchema,
  })
}

/** Newsletter signup from the storefront footer or the maintenance page. */
export function useSubscribeNewsletter(source: NewsletterSource = 'footer') {
  return useMutation({
    mutationFn: (payload: NewsletterForm) => subscribeNewsletter(payload, source),
  })
}
