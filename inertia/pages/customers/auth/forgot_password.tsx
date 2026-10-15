import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import CustomerAuthLayout from '~/layouts/customer_auth'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { auth } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useForgotPassword } from './_hooks'
import { ForgotPasswordFormSchema } from './_types'

export default function CustomerForgotPassword() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const forgot = useForgotPassword()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = ForgotPasswordFormSchema.safeParse({ email })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    forgot.mutate(parsed.data, { onError: (error) => handleMutationError(error, setErrors) })
  }

  return (
    <>
      <Head title="Forgot password" />
      <Link
        route="customers.session.create"
        className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={12} /> Sign in
      </Link>
      <h1 className={auth.title}>Forgot your password?</h1>
      <p className={auth.subtitle}>
        Enter your email. If it has an account, we&apos;ll send you a code to reset your password.
      </p>

      <form className={auth.form} onSubmit={onSubmit} noValidate>
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
        <FormButton block loading={forgot.isPending} className="mt-1">
          Send reset code
        </FormButton>
      </form>
    </>
  )
}

CustomerForgotPassword.layout = [CustomerAuthLayout]
