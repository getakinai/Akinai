import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormTagsInput, FormTextarea } from '~/components/form'
import Section from '~/components/section'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { useAdminCustomerFilterOptions, useUpdateAdminCustomerNotes } from './_hooks'
import {
  AdminCustomerNotesFormSchema,
  MAX_CUSTOMER_NOTE_LENGTH,
  MAX_CUSTOMER_TAG_LENGTH,
  type AdminCustomerDetail,
} from './_types'

type NotesCardProps = {
  customer: AdminCustomerDetail
  editable: boolean
}

/**
 * Staff-only tags and note. The customer never sees either. Remount with a
 * new `key` after the customer changes to reset the fields.
 */
export default function NotesCard({ customer, editable }: NotesCardProps) {
  const [tags, setTags] = useState(customer.tags)
  const [note, setNote] = useState(customer.note ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const options = useAdminCustomerFilterOptions()
  const updateNotes = useUpdateAdminCustomerNotes()

  const dirty = tags.join('\n') !== customer.tags.join('\n') || note !== (customer.note ?? '')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminCustomerNotesFormSchema.safeParse({ tags, note: emptyToNull(note) })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateNotes.mutate(
      { id: customer.id, ...parsed.data },
      {
        onSuccess: () => toast.success('Tags and note saved'),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className={panel} onSubmit={onSubmit} noValidate>
      <Section
        title="Tags and notes"
        description="Only staff can see these. Use tags to group customers into segments."
      >
        <FormTagsInput
          name="customerTags"
          label="Tags"
          values={tags}
          onChange={setTags}
          suggestions={options.data?.tags ?? []}
          maxLength={MAX_CUSTOMER_TAG_LENGTH}
          disabled={!editable}
          placeholder="vip, wholesale… then press Enter"
          error={errors.tags}
        />
        <FormTextarea
          name="customerNote"
          label="Note"
          rows={4}
          maxLength={MAX_CUSTOMER_NOTE_LENGTH}
          value={note}
          disabled={!editable}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
        />
        {editable && (
          <div className="flex justify-end">
            <FormButton size="sm" disabled={!dirty} loading={updateNotes.isPending}>
              Save tags and note
            </FormButton>
          </div>
        )}
      </Section>
    </form>
  )
}
