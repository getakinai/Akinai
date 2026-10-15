import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminRole, useUpdateAdminRole } from './_hooks'
import { AdminRoleFormSchema, type AdminRole } from './_types'

type RoleDialogProps = {
  open: boolean
  role: AdminRole | null
  onClose: () => void
}

/**
 * Creates a role when `role` is null, otherwise renames it. Remount with a
 * new `key` to reset the fields between roles.
 */
export default function RoleDialog({ open, role, onClose }: RoleDialogProps) {
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createRole = useCreateAdminRole()
  const updateRole = useUpdateAdminRole()
  const isPending = createRole.isPending || updateRole.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminRoleFormSchema.safeParse({
      name,
      description: emptyToNull(description),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminRole) => {
        toast.success(role ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (role) {
      updateRole.mutate({ id: role.id, ...parsed.data }, options)
    } else {
      createRole.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={role ? 'Edit role' : 'Add role'}
      description={
        role
          ? 'Rename the role or update its description.'
          : 'New roles start with no permissions. Grant them in the matrix below.'
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="roleName"
          label="Name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <FormInput
          name="roleDescription"
          label="Description"
          autoComplete="off"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {role ? 'Save changes' : 'Create role'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
