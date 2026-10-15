import { type FormEvent, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { FormButton, FormInput } from '~/components/form'
import RecaptchaNotice from '~/components/recaptcha_notice'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { MARKETING_CONSENT_HINT } from '~/lib/marketing'
import { isRecaptchaConfigured, loadRecaptcha } from '~/lib/recaptcha'
import { cn } from '~/lib/styles'
import { type NewsletterSource, useSubscribeNewsletter } from './_hooks'
import { NewsletterFormSchema } from './_types'

type NewsletterFormProps = {
  variant?: NewsletterSource
}

const variants = {
  footer: {
    title: 'Newsletter',
    description: 'Get news, promotions and discounts by email.',
    wrapper: 'flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10',
    intro: 'min-w-0 md:max-w-md',
    heading: 'text-[13px] font-semibold tracking-[0.06em] uppercase opacity-70',
    text: 'mt-2 text-[13.5px] text-pretty opacity-80',
    body: 'flex w-full min-w-0 flex-col gap-3 md:max-w-md',
    field: '[&_span]:text-sf-primary-fg',
    notice: 'opacity-70',
  },
  maintenance: {
    title: 'Get notified when we’re back',
    description: 'Join the newsletter for store news and offers.',
    wrapper: 'mx-auto flex w-full max-w-[420px] min-w-0 flex-col gap-3 px-6 text-left',
    intro: 'min-w-0 text-center',
    heading: 'text-[15px] font-semibold text-ink',
    text: 'mt-1 text-[13px] text-pretty text-muted',
    body: 'flex w-full min-w-0 flex-col gap-3',
    field: '',
    notice: 'text-center text-muted',
  },
} satisfies Record<NewsletterSource, Record<string, string>>

/**
 * Newsletter signup for guests and signed-in shoppers: the band at the top
 * of the storefront footer, or the form on the maintenance page. The bot
 * check script loads when the field is first focused, not on every page.
 */
export default function NewsletterForm({ variant = 'footer' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const subscribe = useSubscribeNewsletter(variant)
  const styles = variants[variant]

  function preloadRecaptcha() {
    if (isRecaptchaConfigured) loadRecaptcha().catch(() => {})
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = NewsletterFormSchema.safeParse({ email })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    subscribe.mutate(parsed.data, {
      onSuccess: () => setEmail(''),
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <div className={styles.heading}>{styles.title}</div>
        <p className={styles.text}>
          {styles.description} {MARKETING_CONSENT_HINT}
        </p>
      </div>
      <div className={styles.body}>
        {subscribe.isSuccess ? (
          <p
            className={cn(
              'flex items-center gap-2 text-[14px]',
              variant === 'maintenance' && 'justify-center'
            )}
            role="status"
          >
            <CheckCircle2 size={16} className="flex-none" />
            Thanks! You’re on the list.
          </p>
        ) : (
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-start"
            onSubmit={onSubmit}
            noValidate
          >
            <div className={cn('min-w-0 flex-1', styles.field)}>
              <FormInput
                name="newsletterEmail"
                type="email"
                label="Email address"
                hideLabel
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onFocus={preloadRecaptcha}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
              />
            </div>
            <FormButton
              variant={variant === 'footer' ? 'secondary' : 'primary'}
              loading={subscribe.isPending}
              loadingText="Subscribing…"
            >
              {variant === 'footer' ? 'Subscribe' : 'Notify me'}
            </FormButton>
          </form>
        )}
        <RecaptchaNotice className={styles.notice} />
      </div>
    </div>
  )
}
