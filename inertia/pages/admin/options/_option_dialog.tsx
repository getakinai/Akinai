import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminOption } from './_hooks'
import { AdminOptionNameFormSchema } from './_types'

type OptionDialogProps = {
  open: boolean
  onClose: () => void
}

export default function OptionDialog({ open, onClose }: OptionDialogProps) {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createOption = useCreateAdminOption()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminOptionNameFormSchema.safeParse({ name })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createOption.mutate(parsed.data, {
      onSuccess: (option) => {
        toast.success(`${option.name} created`)
        onClose()
        setName('')
        router.visit(`/admin/options/edit/${option.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add option"
      description="Create a shared option name such as Size or Color. You can add values on the next screen."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="name"
          label="Name"
          placeholder="Size"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={createOption.isPending}>
            Create
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
