import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { useDeleteAdminVariant } from './_hooks'
import { type AdminVariant } from './_types'

type DeleteVariantDialogProps = {
  variant: AdminVariant | null
  onClose: () => void
  onDeleted?: () => void
}

export default function DeleteVariantDialog({
  variant,
  onClose,
  onDeleted,
}: DeleteVariantDialogProps) {
  const deleteVariant = useDeleteAdminVariant()

  function onConfirm() {
    if (!variant) return
    deleteVariant.mutate(
      { productId: variant.productId, id: variant.id },
      {
        onSuccess: () => {
          toast.success(`${variant.title} deleted`)
          onClose()
          onDeleted?.()
        },
        onError: (error) => {
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
        },
      }
    )
  }

  return (
    <Dialog
      open={variant !== null}
      onClose={onClose}
      title="Delete variant"
      description={
        variant ? (
          <>
            Delete <strong className="font-medium text-ink">{variant.title}</strong> and its stock
            levels? This can&apos;t be undone, and saving options won&apos;t bring it back.
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
          loading={deleteVariant.isPending}
          onClick={onConfirm}
        >
          Delete variant
        </FormButton>
      </div>
    </Dialog>
  )
}
