import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import Section from '~/components/section'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { useUpdateAdminProductOptions } from '../_hooks'
import { optionsError } from '../_options_editor'
import OptionsPicker, {
  emptyOptionPickerDraft,
  fromOptionPickerDrafts,
  type OptionPickerDraft,
} from '../_options_picker'
import { ProductOptionsFormSchema, type AdminProductDetail } from '../_types'

type FirstOptionFormProps = {
  product: AdminProductDetail
  editable: boolean
  onCancel: () => void
  onVariantsAdded: () => void
}

/**
 * Shown when adding a variant to a product that has no options yet: the
 * product needs an option (e.g. Size) before it can have more than one
 * variant.
 */
export default function FirstOptionForm({
  product,
  editable,
  onCancel,
  onVariantsAdded,
}: FirstOptionFormProps) {
  const [drafts, setDrafts] = useState<OptionPickerDraft[]>(() => [emptyOptionPickerDraft()])
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateOptions = useUpdateAdminProductOptions()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const options = fromOptionPickerDrafts(drafts)
    if (options.length === 0) {
      return setErrors({ options: 'Choose an option and pick at least one value' })
    }
    const parsed = ProductOptionsFormSchema.safeParse(options)
    if (!parsed.success) return setErrors({ options: parsed.error.issues[0].message })

    setErrors({})
    updateOptions.mutate(
      { id: product.id, options: parsed.data },
      {
        onSuccess: (saved) => {
          const added = saved.variants.length - product.variants.length
          if (added > 0) {
            toast.success(`${added} ${added === 1 ? 'variant' : 'variants'} added`)
            onVariantsAdded()
          } else {
            toast.success('Option added. Pick a value for the new variant.')
          }
        },
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className={panel} onSubmit={handleSubmit} noValidate>
      <Section
        title="Add an option first"
        description="This product has a single default variant. Pick the option it varies by (for example Size) and its values. The current variant takes the first value, and a variant is added for each other value."
      >
        <OptionsPicker
          drafts={drafts}
          onChange={setDrafts}
          disabled={!editable || updateOptions.isPending}
          error={optionsError(errors)}
        />
      </Section>

      <div className="mt-7 flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" onClick={onCancel}>
          {editable ? 'Cancel' : 'Back'}
        </FormButton>
        {editable && (
          <FormButton loading={updateOptions.isPending} loadingText="Saving…">
            Save options
          </FormButton>
        )}
      </div>
    </form>
  )
}
