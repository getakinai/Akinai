import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import { FormButton, FormInput } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { auth, cn, panel } from '~/lib/styles'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { useCreateAdminUser } from './_hooks'
import { AdminUserCreateFormSchema } from './_types'

export default function AdminUsersCreate() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createUser = useCreateAdminUser()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminUserCreateFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      email,
      password,
      passwordConfirmation,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createUser.mutate(parsed.data, {
      onSuccess: (user) => {
        toast.success(`${user.email} can now sign in`)
        router.visit('/admin/users')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Page
      eyebrow={
        <Link route="admin.users.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Users
        </Link>
      }
      title="Add user"
      description="Create a staff account for the back office."
    >
      <form className={cn(panel, auth.form)} onSubmit={onSubmit} noValidate>
        <FormInput
          name="fullName"
          label="Full name"
          autoComplete="off"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <FormInput
          name="email"
          label="Email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <FormInput
          name="password"
          label="Password"
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
        <FormButton loading={createUser.isPending}>Create user</FormButton>
      </form>
    </Page>
  )
}

AdminUsersCreate.layout = [AdminLayout]
