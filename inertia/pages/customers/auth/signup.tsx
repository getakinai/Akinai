import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import CustomerAuthLayout from '~/layouts/customer_auth'
import { FormButton, FormInput, FormSwitch } from '~/components/form'
import { MARKETING_CONSENT_LABEL } from '~/lib/marketing'
import { type FieldErrors } from '~/lib/http'
import { auth, cn, inlineLink } from '~/lib/styles'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { useCustomerSignup } from './_hooks'
import { CustomerSignupFormSchema, PASSWORD_MIN_LENGTH } from './_types'
import SocialButtons from './_social_buttons'

export default function CustomerSignup() {
  const [mode, setMode] = useState<'choose' | 'email'>('choose')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [acceptsMarketing, setAcceptsMarketing] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const signup = useCustomerSignup()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = CustomerSignupFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      email,
      phone: emptyToNull(phone),
      password,
      passwordConfirmation,
      acceptsMarketing,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    signup.mutate(parsed.data, { onError: (error) => handleMutationError(error, setErrors) })
  }

  return (
    <>
      <Head title="Create account" />
      <h1 className={cn(auth.title, 'text-center')}>Create your account</h1>
      <p className={cn(auth.subtitle, 'text-center text-balance')}>
        {mode === 'choose'
          ? 'Save your details for faster checkout.'
          : "Save your details for faster checkout. We'll email you a code to confirm it's you."}
      </p>

      {mode === 'choose' ? (
        <>
          <SocialButtons intent="signup" onEmail={() => setMode('email')} />
          <p className="mt-4 text-center text-[12.5px] leading-relaxed text-pretty text-subtle">
            New accounts get our news, promotions and discounts by email. You can turn this off
            anytime in your account details.
          </p>
        </>
      ) : (
        <form className={auth.form} onSubmit={onSubmit} noValidate>
          <FormInput
            name="fullName"
            label="Full name"
            autoComplete="name"
            placeholder="Juan dela Cruz"
            autoFocus
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
          />
          <FormInput
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <FormInput
            name="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
          />
          <FormInput
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <FormInput
            name="passwordConfirmation"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            error={errors.passwordConfirmation}
          />
          <FormSwitch
            name="acceptsMarketing"
            label={MARKETING_CONSENT_LABEL}
            checked={acceptsMarketing}
            onChange={(event) => setAcceptsMarketing(event.target.checked)}
            error={errors.acceptsMarketing}
          />
          <FormButton block loading={signup.isPending} className="mt-1">
            Continue
          </FormButton>
          <FormButton
            type="button"
            variant="ghost"
            size="sm"
            className="self-center"
            onClick={() => setMode('choose')}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Other sign-up options
          </FormButton>
        </form>
      )}

      <p className={auth.foot}>
        Already have an account?{' '}
        <Link route="customers.session.create" className={inlineLink}>
          Sign in
        </Link>
      </p>
    </>
  )
}

CustomerSignup.layout = [CustomerAuthLayout]
