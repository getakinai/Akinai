import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminCustomer } from '../../customers/_hooks'
import { AdminCustomerFormSchema, type AdminCustomerDetail } from '../../customers/_types'

type CreateCustomerDialogProps = {
  open: boolean
  onClose: () => void
  onCreated: (customer: AdminCustomerDetail) => void
}

export default function CreateCustomerDialog({
  open,
  onClose,
  onCreated,
}: CreateCustomerDialogProps) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const createCustomer = useCreateAdminCustomer()

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create customer"
      description="Add a customer record. They can sign up later with the same email."
      className="w-[min(460px,calc(100vw-24px))]"
    >
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const parsed = AdminCustomerFormSchema.safeParse({
            fullName: emptyToNull(form.fullName),
            email: form.email.trim(),
            phone: emptyToNull(form.phone),
          })
          if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
          createCustomer.mutate(parsed.data, {
            onSuccess: (customer) => {
              toast.success('Customer created')
              onCreated(customer)
              onClose()
            },
            onError: (error) => handleMutationError(error, setErrors),
          })
        }}
      >
        <FormInput
          name="fullName"
          label="Full name"
          value={form.fullName}
          autoComplete="off"
          error={errors.fullName}
          onChange={(event) => setField('fullName', event.target.value)}
        />
        <FormInput
          name="email"
          label="Email"
          type="email"
          value={form.email}
          autoComplete="off"
          error={errors.email}
          onChange={(event) => setField('email', event.target.value)}
        />
        <FormInput
          name="phone"
          label="Phone"
          type="tel"
          value={form.phone}
          autoComplete="off"
          error={errors.phone}
          onChange={(event) => setField('phone', event.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton type="submit" loading={createCustomer.isPending} loadingText="Creating…">
            Create customer
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
