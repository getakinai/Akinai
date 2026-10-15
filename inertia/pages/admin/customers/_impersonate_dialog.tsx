import { useState, type FormEvent } from 'react'
import { FormButton, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { customerDisplayName } from './_format'
import { useImpersonateAdminCustomer } from './_hooks'
import { AdminCustomerImpersonationFormSchema, MAX_IMPERSONATION_REASON_LENGTH } from './_types'

type ImpersonateDialogProps = {
  open: boolean
  customer: { id: string; fullName: string | null; email: string }
  onClose: () => void
}

export default function ImpersonateDialog({ open, customer, onClose }: ImpersonateDialogProps) {
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const impersonate = useImpersonateAdminCustomer()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminCustomerImpersonationFormSchema.safeParse({ reason })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    impersonate.mutate(
      { id: customer.id, ...parsed.data },
      { onError: (error) => handleMutationError(error, setErrors) }
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Sign in as ${customerDisplayName(customer)}`}
      description="You'll browse the storefront as this customer. Anything you do, including placing orders, is recorded under your name. The reason is kept in the activity log."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormTextarea
          name="impersonationReason"
          label="Reason"
          rows={3}
          maxLength={MAX_IMPERSONATION_REASON_LENGTH}
          placeholder="e.g. Customer asked for help finding their order."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors.reason}
          disabled={impersonate.isPending}
          autoFocus
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={impersonate.isPending} loadingText="Signing in…">
            Sign in as customer
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
