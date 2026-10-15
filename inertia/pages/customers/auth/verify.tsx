import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import CustomerAuthLayout from '~/layouts/customer_auth'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { auth, inlineLink } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import ResendCodeButton from './_resend_code_button'
import { useCustomerSignupVerify, useResendSignupCode, useSignupVerification } from './_hooks'
import { VERIFICATION_CODE_LENGTH, VerificationCodeFormSchema } from './_types'

export default function CustomerSignupVerify() {
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const pending = useSignupVerification()
  const verify = useCustomerSignupVerify()
  const resend = useResendSignupCode()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = VerificationCodeFormSchema.safeParse({ code })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    verify.mutate(parsed.data, { onError: (error) => handleMutationError(error, setErrors) })
  }

  return (
    <>
      <Head title="Confirm your email" />
      <Link
        route="customers.registration.create"
        className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={12} /> Sign up
      </Link>
      <h1 className={auth.title}>Check your email</h1>
      <p className={auth.subtitle}>
        {pending.isLoading && 'Looking up your sign-up…'}
        {pending.isError && 'Your sign-up has expired. Please start again.'}
        {pending.data && (
          <>
            We sent a {VERIFICATION_CODE_LENGTH}-digit code to{' '}
            <span className="font-medium break-all text-ink">{pending.data.data.email}</span>. It
            expires in 10 minutes.
          </>
        )}
      </p>

      <form className={auth.form} onSubmit={onSubmit} noValidate>
        <FormInput
          name="code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={VERIFICATION_CODE_LENGTH}
          placeholder="123456"
          className="text-center font-mono text-[20px] tracking-[0.4em]"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          error={errors.code}
          autoFocus
        />
        <FormButton block loading={verify.isPending} disabled={pending.isError} className="mt-1">
          Create account
        </FormButton>
        <ResendCodeButton resend={resend} />
      </form>

      <p className={auth.foot}>
        Wrong email?{' '}
        <Link route="customers.registration.create" className={inlineLink}>
          Start again
        </Link>
      </p>
    </>
  )
}

CustomerSignupVerify.layout = [CustomerAuthLayout]
