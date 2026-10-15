import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog, IconButton } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useUpdateAdminStoreNotifications } from './_hooks'
import {
  AdminStoreNotificationsFormSchema,
  MAX_ORDER_NOTIFICATION_EMAILS,
  type AdminStoreSettings,
} from './_types'

type NotificationsDialogProps = {
  open: boolean
  settings: AdminStoreSettings
  onClose: () => void
}

/** Edits the staff addresses that get new order and return alerts. */
export default function NotificationsDialog({ open, settings, onClose }: NotificationsDialogProps) {
  const [emails, setEmails] = useState<string[]>(
    settings.orderNotificationEmails.length > 0 ? settings.orderNotificationEmails : ['']
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const update = useUpdateAdminStoreNotifications()

  const setEmail = (index: number, value: string) =>
    setEmails((current) => current.map((email, i) => (i === index ? value : email)))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStoreNotificationsFormSchema.safeParse({
      orderNotificationEmails: emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email !== ''),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    update.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Notification emails saved')
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Staff order notifications"
      description={`New order and return request alerts go to these addresses (up to ${MAX_ORDER_NOTIFICATION_EMAILS}). Leave empty to use the owner email${settings.ownerEmail ? ` (${settings.ownerEmail})` : ''}.`}
      className="w-[min(520px,calc(100vw-24px))]"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {errors.orderNotificationEmails && (
          <p className="text-[13px] text-danger">{errors.orderNotificationEmails}</p>
        )}
        {emails.map((email, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <FormInput
                name={`orderNotificationEmails.${index}`}
                label={`Email ${index + 1}`}
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(index, event.target.value)}
                error={errors[`orderNotificationEmails.${index}`]}
              />
            </div>
            <IconButton
              label={`Remove email ${index + 1}`}
              size="sm"
              className="mb-1"
              onClick={() =>
                setEmails((current) =>
                  current.length === 1 ? [''] : current.filter((_, i) => i !== index)
                )
              }
            >
              <Trash2 size={15} />
            </IconButton>
          </div>
        ))}
        {emails.length < MAX_ORDER_NOTIFICATION_EMAILS && (
          <div>
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEmails((current) => [...current, ''])}
            >
              <Plus size={14} /> Add email
            </FormButton>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={update.isPending}>
            Save
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
