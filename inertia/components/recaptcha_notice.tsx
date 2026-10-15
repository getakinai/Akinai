import { isRecaptchaConfigured } from '~/lib/recaptcha'
import { cn } from '~/lib/styles'

type RecaptchaNoticeProps = {
  className?: string
}

const link = 'underline decoration-1 underline-offset-2 hover:text-current'

/**
 * Google's required attribution when the reCAPTCHA badge is hidden.
 * Renders nothing when no site key is configured.
 */
export default function RecaptchaNotice({ className }: RecaptchaNoticeProps) {
  if (!isRecaptchaConfigured) return null

  return (
    <p className={cn('text-[12px] leading-snug text-pretty', className)}>
      Protected by reCAPTCHA. The Google{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
        className={link}
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className={link}>
        Terms of Service
      </a>{' '}
      apply.
    </p>
  )
}
