import { HttpError } from './http'

export type RecaptchaAction =
  | 'admin_login'
  | 'admin_login_mfa'
  | 'admin_setup'
  | 'customer_login'
  | 'customer_signup'
  | 'customer_signup_verify'
  | 'customer_signup_resend'
  | 'customer_forgot_password'
  | 'customer_password_reset'
  | 'customer_password_reset_resend'
  | 'customer_newsletter'
  | 'maintenance_newsletter'
  | 'checkout'
  | 'support_ticket_create'
  | 'support_ticket_reply'

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: RecaptchaAction }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

const SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? ''

export const isRecaptchaConfigured = SITE_KEY !== ''

const UNAVAILABLE_MESSAGE = 'Bot check could not load. Check your connection and try again.'

let loader: Promise<Grecaptcha> | null = null

/**
 * Injects the reCAPTCHA v3 script once. The nonce lets it pass the CSP
 * `script-src` (Google's follow-up scripts are allowed by host).
 */
export function loadRecaptcha(): Promise<Grecaptcha> {
  if (!isRecaptchaConfigured || typeof window === 'undefined') {
    return Promise.reject(new HttpError(UNAVAILABLE_MESSAGE, 0))
  }

  loader ??= new Promise<Grecaptcha>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`
    script.async = true
    const nonce = document.querySelector<HTMLMetaElement>('meta[property=csp-nonce]')?.nonce
    if (nonce) script.nonce = nonce
    script.onload = () => {
      const grecaptcha = window.grecaptcha
      if (!grecaptcha) return reject(new HttpError(UNAVAILABLE_MESSAGE, 0))
      grecaptcha.ready(() => resolve(grecaptcha))
    }
    script.onerror = () => {
      script.remove()
      loader = null
      reject(new HttpError(UNAVAILABLE_MESSAGE, 0))
    }
    document.head.appendChild(script)
  })
  return loader
}

/**
 * Header with a fresh reCAPTCHA token for `action`, or `{}` when no site
 * key is configured (local development). Tokens expire after 2 minutes,
 * so call this right before the request.
 */
export async function recaptchaHeaders(action: RecaptchaAction): Promise<Record<string, string>> {
  if (!isRecaptchaConfigured || typeof window === 'undefined') return {}

  const grecaptcha = await loadRecaptcha()
  try {
    const token = await grecaptcha.execute(SITE_KEY, { action })
    return { 'X-Recaptcha-Token': token }
  } catch {
    throw new HttpError(UNAVAILABLE_MESSAGE, 0)
  }
}
