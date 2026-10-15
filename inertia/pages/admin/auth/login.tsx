import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import AuthLayout from '~/layouts/auth'
import { FormButton, FormInput } from '~/components/form'
import { HttpError, type FieldErrors } from '~/lib/http'
import { auth } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useAdminLogin, useAdminLoginMfa } from './_hooks'
import { AdminLoginFormSchema, AdminLoginMfaFormSchema } from './_types'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'mfa'>('password')
  const [errors, setErrors] = useState<FieldErrors>({})
  const login = useAdminLogin()
  const verifyMfa = useAdminLoginMfa()

  function onSubmitPassword(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminLoginFormSchema.safeParse({ email, password })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    login.mutate(parsed.data, {
      onSuccess: ({ data }) => {
        if ('mfaRequired' in data) {
          setPassword('')
          setStep('mfa')
        }
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  function onSubmitCode(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminLoginMfaFormSchema.safeParse({ code })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    verifyMfa.mutate(parsed.data, {
      onError: (error) => {
        if (error instanceof HttpError && error.status === 410) backToPassword()
        handleMutationError(error, setErrors)
      },
    })
  }

  function backToPassword() {
    setCode('')
    setErrors({})
    setStep('password')
  }

  if (step === 'mfa') {
    return (
      <>
        <Head title="Staff sign in" />
        <h1 className={auth.title}>2FA verification</h1>
        <p className={auth.subtitle}>
          Enter the 6-digit code from your authenticator app, or one of your recovery codes.
        </p>

        <form className={auth.form} onSubmit={onSubmitCode} noValidate>
          <FormInput
            name="code"
            label="Verification code"
            autoComplete="one-time-code"
            inputMode="text"
            autoFocus
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={errors.code}
          />
          <FormButton block loading={verifyMfa.isPending} className="mt-1">
            Verify
          </FormButton>
          <FormButton type="button" variant="ghost" block onClick={backToPassword}>
            Use a different account
          </FormButton>
        </form>
      </>
    )
  }

  return (
    <>
      <Head title="Staff sign in" />
      <h1 className={auth.title}>Staff sign in</h1>
      <p className={auth.subtitle}>Manage products, orders and customers.</p>

      <form className={auth.form} onSubmit={onSubmitPassword} noValidate>
        <FormInput
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@store.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <FormInput
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <FormButton block loading={login.isPending} className="mt-1">
          Sign in
        </FormButton>
      </form>
    </>
  )
}

AdminLogin.layout = [AuthLayout]
