import { useState, type FormEvent } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import AuthLayout from '~/layouts/auth'
import { FormButton, FormInput, FormSelectWithSearch } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { HttpError, type FieldErrors } from '~/lib/http'
import { auth, inlineLink } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useAdminSetup, useAdminSetupStatus } from './_hooks'
import { AdminSetupFormSchema } from './_types'

export default function AdminSetup() {
  const status = useAdminSetupStatus()
  const setup = useAdminSetup()
  const [setupToken, setSetupToken] = useState('')
  const [operatingCountryCode, setOperatingCountryCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminSetupFormSchema.safeParse({
      setupToken,
      operatingCountryCode,
      fullName,
      email,
      password,
      passwordConfirmation,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    setup.mutate(parsed.data, {
      onError: (error) => {
        if (error instanceof HttpError && error.status === 400) {
          return setErrors({ setupToken: error.message })
        }
        handleMutationError(error, setErrors)
      },
    })
  }

  return (
    <>
      <Head title="Set up your store" />
      <h1 className={auth.title}>Set up your store</h1>
      <p className={auth.subtitle}>Create the first admin account for the back office.</p>

      {status.isLoading && (
        <div className="mt-[22px] flex flex-col gap-[15px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {status.isError && (
        <div className="mt-[22px] flex flex-col gap-3 text-[14px] text-muted">
          <p>Couldn&apos;t check the setup status.</p>
          <FormButton type="button" variant="ghost" onClick={() => status.refetch()}>
            Try again
          </FormButton>
        </div>
      )}

      {status.data && !status.data.available && (
        <p className="mt-[22px] text-[14px] text-muted">
          This store is already set up.{' '}
          <Link route="admin.session.create" className={inlineLink}>
            Sign in
          </Link>
        </p>
      )}

      {status.data?.available && !status.data.tokenConfigured && (
        <div className="mt-[22px] flex flex-col gap-2 text-[14px] text-muted">
          <p>Setup is locked until a setup token is configured on the server.</p>
          <p>
            Add <code className="font-mono text-ink">SETUP_TOKEN</code> (32 or more random
            characters, e.g. <code className="font-mono text-ink">openssl rand -hex 32</code>) to
            the server&apos;s environment file, restart the app, then reload this page.
          </p>
        </div>
      )}

      {status.data?.available && status.data.tokenConfigured && (
        <form className={auth.form} onSubmit={onSubmit} noValidate>
          <FormInput
            name="setupToken"
            label="Setup token"
            type="password"
            autoComplete="off"
            value={setupToken}
            onChange={(event) => setSetupToken(event.target.value)}
            error={errors.setupToken}
          />
          <FormSelectWithSearch
            name="operatingCountryCode"
            label="Default country you deliver to"
            placeholder="Choose a country"
            searchPlaceholder="Search countries"
            tooltip="Sets up starting markets, taxes and shipping zones for some countries. You can change them later."
            options={COUNTRY_OPTIONS}
            value={operatingCountryCode}
            onChange={setOperatingCountryCode}
            error={errors.operatingCountryCode}
          />
          <FormInput
            name="fullName"
            label="Full name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
          />
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
            label="Password (at least 12 characters)"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <FormInput
            name="passwordConfirmation"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            error={errors.passwordConfirmation}
          />
          <FormButton block loading={setup.isPending} className="mt-1">
            Create admin account
          </FormButton>
        </form>
      )}
    </>
  )
}

AdminSetup.layout = [AuthLayout]
