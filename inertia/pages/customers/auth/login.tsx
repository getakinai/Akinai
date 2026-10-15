import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import CustomerAuthLayout from '~/layouts/customer_auth'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { auth, cn, inlineLink } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useCustomerLogin } from './_hooks'
import { CustomerLoginFormSchema } from './_types'
import SocialButtons from './_social_buttons'

export default function CustomerLogin() {
  const [mode, setMode] = useState<'choose' | 'email'>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const login = useCustomerLogin()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = CustomerLoginFormSchema.safeParse({ email, password })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    login.mutate(parsed.data, { onError: (error) => handleMutationError(error, setErrors) })
  }

  return (
    <>
      <Head title="Sign in" />
      <h1 className={cn(auth.title, 'text-center')}>Welcome back</h1>
      <p className={cn(auth.subtitle, 'text-center')}>
        Sign in to track orders and check out faster.
      </p>

      {mode === 'choose' ? (
        <SocialButtons intent="login" onEmail={() => setMode('email')} />
      ) : (
        <form className={auth.form} onSubmit={onSubmit} noValidate>
          <FormInput
            name="email"
            label="Email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            autoFocus
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
          <Link
            route="customers.password.forgot.create"
            className={cn(inlineLink, '-mt-1.5 self-end text-[13px]')}
          >
            Forgot password?
          </Link>
          <FormButton block loading={login.isPending} className="mt-1">
            Sign in
          </FormButton>
          <FormButton
            type="button"
            variant="ghost"
            size="sm"
            className="self-center"
            onClick={() => setMode('choose')}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Other sign-in options
          </FormButton>
        </form>
      )}

      <p className={auth.foot}>
        New here?{' '}
        <Link route="customers.registration.create" className={inlineLink}>
          Create an account
        </Link>
      </p>
    </>
  )
}

CustomerLogin.layout = [CustomerAuthLayout]
