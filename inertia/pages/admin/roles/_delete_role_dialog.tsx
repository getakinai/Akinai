import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { useDeleteAdminRole } from './_hooks'
import { type AdminRole } from './_types'

type DeleteRoleDialogProps = {
  role: AdminRole | null
  onClose: () => void
}

export default function DeleteRoleDialog({ role, onClose }: DeleteRoleDialogProps) {
  const deleteRole = useDeleteAdminRole()

  function onConfirm() {
    if (!role) return
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toast.success(`${role.name} deleted`)
        onClose()
      },
      onError: (error) => {
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
      },
    })
  }

  return (
    <Dialog
      open={role !== null}
      onClose={onClose}
      title="Delete role"
      description={
        role ? (
          <>
            Delete <strong className="font-medium text-ink">{role.name}</strong>? This can&apos;t be
            undone.
          </>
        ) : null
      }
    >
      <div className="flex justify-end gap-2.5">
        <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          variant="danger"
          size="sm"
          loading={deleteRole.isPending}
          onClick={onConfirm}
        >
          Delete role
        </FormButton>
      </div>
    </Dialog>
  )
}
