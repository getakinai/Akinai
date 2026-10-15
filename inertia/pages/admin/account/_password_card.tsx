import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useChangePassword } from './_hooks'
import { PasswordChangeFormSchema, STAFF_PASSWORD_MIN_LENGTH } from './_types'

export default function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const changePassword = useChangePassword()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = PasswordChangeFormSchema.safeParse({
      currentPassword,
      password,
      passwordConfirmation,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    changePassword.mutate(parsed.data, {
      onSuccess: ({ message }) => {
        toast.success(message)
        setCurrentPassword('')
        setPassword('')
        setPasswordConfirmation('')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Sign-in</span>
          <h2 className={card.title}>Password</h2>
          <p className="mt-0.5 text-[13px] text-pretty text-muted">
            Changing your password signs you out on every other device.
          </p>
        </div>
      </header>

      <form className="flex max-w-[480px] flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.currentPassword}
        />
        <FormInput
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder={`At least ${STAFF_PASSWORD_MIN_LENGTH} characters`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <FormInput
          name="passwordConfirmation"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={errors.passwordConfirmation}
        />
        <div>
          <FormButton loading={changePassword.isPending}>Change password</FormButton>
        </div>
      </form>
    </section>
  )
}
