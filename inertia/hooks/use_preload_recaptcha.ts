import { useEffect } from 'react'
import { isRecaptchaConfigured, loadRecaptcha } from '~/lib/recaptcha'

/** Loads the reCAPTCHA script on mount so the first submit isn't delayed. */
export function usePreloadRecaptcha() {
  useEffect(() => {
    if (isRecaptchaConfigured) loadRecaptcha().catch(() => {})
  }, [])
}
