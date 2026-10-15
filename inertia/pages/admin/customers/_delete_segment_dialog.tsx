import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { useDeleteAdminCustomerSegment } from './_hooks'
import { type AdminCustomerSegment } from './_types'

type DeleteSegmentDialogProps = {
  segment: AdminCustomerSegment | null
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteSegmentDialog({
  segment,
  onClose,
  onDeleted,
}: DeleteSegmentDialogProps) {
  const deleteSegment = useDeleteAdminCustomerSegment()

  function onConfirm() {
    if (!segment) return
    deleteSegment.mutate(segment.id, {
      onSuccess: () => {
        toast.success(`Segment “${segment.name}” deleted`)
        onDeleted()
        onClose()
      },
      onError: (error) => {
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
      },
    })
  }

  return (
    <Dialog
      open={segment !== null}
      onClose={onClose}
      title="Delete segment"
      description={
        segment ? (
          <>
            Delete <strong className="font-medium text-ink">{segment.name}</strong>? Customers and
            their tags are not changed.
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
          loading={deleteSegment.isPending}
          onClick={onConfirm}
        >
          Delete segment
        </FormButton>
      </div>
    </Dialog>
  )
}
