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
import { usePasswordReset, useResendPasswordResetCode, useResetPassword } from './_hooks'
import { PASSWORD_MIN_LENGTH, ResetPasswordFormSchema, VERIFICATION_CODE_LENGTH } from './_types'

export default function CustomerResetPassword() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const pending = usePasswordReset()
  const reset = useResetPassword()
  const resend = useResendPasswordResetCode()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = ResetPasswordFormSchema.safeParse({ code, password, passwordConfirmation })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    reset.mutate(parsed.data, { onError: (error) => handleMutationError(error, setErrors) })
  }

  return (
    <>
      <Head title="Reset password" />
      <Link
        route="customers.password.forgot.create"
        className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={12} /> Forgot password
      </Link>
      <h1 className={auth.title}>Choose a new password</h1>
      <p className={auth.subtitle}>
        {pending.isLoading && 'Looking up your request…'}
        {pending.isError && 'Your reset request has expired. Please start again.'}
        {pending.data && (
          <>
            If <span className="font-medium break-all text-ink">{pending.data.data.email}</span> has
            an account, we sent it a {VERIFICATION_CODE_LENGTH}-digit code. It expires in 10
            minutes.
          </>
        )}
      </p>

      <form className={auth.form} onSubmit={onSubmit} noValidate>
        <FormInput
          name="code"
          label="Reset code"
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
        <FormInput
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <FormInput
          name="passwordConfirmation"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={errors.passwordConfirmation}
        />
        <FormButton block loading={reset.isPending} disabled={pending.isError} className="mt-1">
          Reset password
        </FormButton>
        <ResendCodeButton resend={resend} />
      </form>

      <p className={auth.foot}>
        Remembered it?{' '}
        <Link route="customers.session.create" className={inlineLink}>
          Sign in
        </Link>
      </p>
    </>
  )
}

CustomerResetPassword.layout = [CustomerAuthLayout]
