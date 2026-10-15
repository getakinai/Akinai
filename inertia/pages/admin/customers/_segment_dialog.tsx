import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminCustomerSegment, useUpdateAdminCustomerSegment } from './_hooks'
import {
  AdminCustomerSegmentFormSchema,
  MAX_CUSTOMER_SEGMENT_NAME_LENGTH,
  type AdminCustomerSegment,
  type AdminCustomerSegmentFilters,
} from './_types'

type SegmentDialogProps = {
  open: boolean
  onClose: () => void
  /** Saves over this segment; creates a new one when null. */
  segment: AdminCustomerSegment | null
  filters: AdminCustomerSegmentFilters
  onSaved: (segment: AdminCustomerSegment) => void
}

/** Names and saves the current filters. Remount (via `key`) to reset. */
export default function SegmentDialog({
  open,
  onClose,
  segment,
  filters,
  onSaved,
}: SegmentDialogProps) {
  const [name, setName] = useState(segment?.name ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createSegment = useCreateAdminCustomerSegment()
  const updateSegment = useUpdateAdminCustomerSegment()
  const pending = createSegment.isPending || updateSegment.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminCustomerSegmentFormSchema.safeParse({ name, filters })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const callbacks = {
      onSuccess: (saved: AdminCustomerSegment) => {
        toast.success(`Segment “${saved.name}” saved`)
        onSaved(saved)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }
    if (segment) updateSegment.mutate({ id: segment.id, ...parsed.data }, callbacks)
    else createSegment.mutate(parsed.data, callbacks)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={segment ? 'Update segment' : 'Save as segment'}
      description={
        segment
          ? 'Saves the current filters to this segment.'
          : 'Save the current filters so you can reapply them from the segment menu.'
      }
      className="w-[min(28rem,calc(100vw-2rem))]"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="segment-name"
          label="Segment name"
          placeholder="Subscribed, 3+ orders"
          maxLength={MAX_CUSTOMER_SEGMENT_NAME_LENGTH}
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name ?? errors.filters}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={pending}>
            Save segment
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
