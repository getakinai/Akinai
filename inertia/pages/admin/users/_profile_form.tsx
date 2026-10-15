import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormInput, FormSelectWithSearch } from '~/components/form'
import Section from '~/components/section'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { type AdminMe, type AdminUser } from '../_types'
import { userDisplayName, userStatusOptions } from './_format'
import { useUpdateAdminUser } from './_hooks'
import { AdminUserUpdateFormSchema, type AdminRoleOption } from './_types'

type ProfileFormProps = {
  user: AdminUser
  me: AdminMe | undefined
  roles: AdminRoleOption[]
  rolesLoading: boolean
}

/**
 * Mirrors UserPolicy so staff only see choices the server will accept:
 * non-admins can't assign the admin role or edit admins, and nobody can
 * change their own role or status.
 */
export default function ProfileForm({ user, me, roles, rolesLoading }: ProfileFormProps) {
  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [email, setEmail] = useState(user.email)
  const [roleId, setRoleId] = useState(user.roleId ?? '')
  const [status, setStatus] = useState<string>(user.status)
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateUser = useUpdateAdminUser()

  const actorIsAdmin = me?.role?.isLocked ?? false
  const isSelf = me?.id === user.id
  const readOnly = Boolean(user.role?.isLocked) && !actorIsAdmin
  const accessLocked = readOnly || isSelf

  const roleOptions = roles
    .filter((role) => actorIsAdmin || !role.isLocked)
    .map((role) => ({
      value: role.id,
      label: role.name,
      badge: role.isLocked
        ? { label: 'All access', tone: 'primary' as const }
        : role.isDefault
          ? { label: 'Default', tone: 'neutral' as const }
          : undefined,
    }))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminUserUpdateFormSchema.safeParse({
      fullName: emptyToNull(fullName),
      email,
      roleId,
      status,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateUser.mutate(
      { id: user.id, ...parsed.data },
      {
        onSuccess: (saved) => {
          toast.success(`${userDisplayName(saved)} saved`)
          router.visit(`/admin/users/show/${saved.id}`)
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className={panel} onSubmit={onSubmit} noValidate>
      {readOnly && (
        <p className="mb-6 text-[13.5px] text-pretty text-muted">
          Only admins can edit an admin account.
        </p>
      )}
      <Section title="Profile">
        <FormInput
          name="fullName"
          label="Full name"
          autoComplete="off"
          value={fullName}
          disabled={readOnly}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <FormInput
          name="email"
          type="email"
          label="Email"
          autoComplete="off"
          value={email}
          disabled={readOnly}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
      </Section>
      <Section
        title="Access"
        description={
          isSelf
            ? "You can't change your own role or status. Ask another admin."
            : 'The role decides what this user can see and do in the back office.'
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormSelectWithSearch
            name="roleId"
            label="Role"
            placeholder="Choose a role"
            value={roleId}
            onChange={setRoleId}
            options={
              accessLocked && user.role
                ? [{ value: user.role.id, label: user.role.name }]
                : roleOptions
            }
            isLoading={rolesLoading}
            disabled={accessLocked}
            error={errors.roleId}
          />
          <FormSelectWithSearch
            name="status"
            label="Status"
            value={status}
            onChange={setStatus}
            options={userStatusOptions}
            disabled={accessLocked}
            error={errors.status}
          />
        </div>
      </Section>
      {!readOnly && (
        <div className="mt-6 flex justify-end">
          <FormButton size="sm" loading={updateUser.isPending}>
            Save changes
          </FormButton>
        </div>
      )}
    </form>
  )
}
