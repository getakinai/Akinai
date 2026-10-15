import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import { FormButton, FormSwitch, FormSelectWithSearch } from '~/components/form'
import { Dialog, IconButton } from '~/components/ui'
import { field, inlineLink } from '~/lib/styles'
import { useAdminOptionsCatalog } from '../options/_hooks'
import { MAX_PRODUCT_OPTIONS, type ProductOptionForm } from './_types'

export type OptionPickerDraft = {
  uid: string
  optionDefinitionId: string
  optionDefinitionValueIds: string[]
}

let nextUid = 0
const uid = () => `picker-${++nextUid}`

export function emptyOptionPickerDraft(): OptionPickerDraft {
  return { uid: uid(), optionDefinitionId: '', optionDefinitionValueIds: [] }
}

export function toOptionPickerDrafts(
  options: {
    optionDefinitionId: string | null
    values: { optionDefinitionValueId: string | null }[]
  }[]
): OptionPickerDraft[] {
  return options
    .filter((option) => option.optionDefinitionId)
    .map((option) => ({
      uid: uid(),
      optionDefinitionId: option.optionDefinitionId!,
      optionDefinitionValueIds: option.values
        .map(({ optionDefinitionValueId }) => optionDefinitionValueId)
        .filter((id): id is string => id !== null),
    }))
}

export function fromOptionPickerDrafts(drafts: OptionPickerDraft[]): ProductOptionForm[] {
  return drafts
    .filter(({ optionDefinitionId, optionDefinitionValueIds }) =>
      Boolean(optionDefinitionId && optionDefinitionValueIds.length > 0)
    )
    .map(({ optionDefinitionId, optionDefinitionValueIds }) => ({
      optionDefinitionId,
      optionDefinitionValueIds,
    }))
}

type OptionsPickerProps = {
  drafts: OptionPickerDraft[]
  onChange: (drafts: OptionPickerDraft[]) => void
  /** When set (product edit), OK on the remove modal applies drafts and persists the delete. */
  onRemoveConfirmed?: (nextDrafts: OptionPickerDraft[]) => void
  disabled?: boolean
  error?: string
}

export default function OptionsPicker({
  drafts,
  onChange,
  onRemoveConfirmed,
  disabled,
  error,
}: OptionsPickerProps) {
  const [removeDraft, setRemoveDraft] = useState<OptionPickerDraft | null>(null)
  const catalog = useAdminOptionsCatalog()
  const entries = catalog.data ?? []
  const assignedDefinitionIds = new Set(
    drafts.map(({ optionDefinitionId }) => optionDefinitionId).filter(Boolean)
  )
  const hasEmptyDraft = drafts.some(({ optionDefinitionId }) => !optionDefinitionId)
  const hasUnusedCatalogOption = entries.some(({ id }) => !assignedDefinitionIds.has(id))
  const canAddOption =
    hasUnusedCatalogOption && !hasEmptyDraft && drafts.length < MAX_PRODUCT_OPTIONS

  function update(target: string, patch: Partial<OptionPickerDraft>) {
    onChange(drafts.map((draft) => (draft.uid === target ? { ...draft, ...patch } : draft)))
  }

  function removeDraftLabel(draft: OptionPickerDraft) {
    const index = drafts.findIndex(({ uid: draftUid }) => draftUid === draft.uid)
    const definition = entries.find(({ id }) => id === draft.optionDefinitionId)
    return definition?.name ?? (index >= 0 ? `Option ${index + 1}` : 'this option')
  }

  function confirmRemoveDraft() {
    if (!removeDraft) return
    const nextDrafts = drafts.filter(({ uid: id }) => id !== removeDraft.uid)
    if (onRemoveConfirmed) onRemoveConfirmed(nextDrafts)
    else onChange(nextDrafts)
    setRemoveDraft(null)
  }

  function toggleValue(draft: OptionPickerDraft, valueId: string, checked: boolean) {
    const ids = new Set(draft.optionDefinitionValueIds)
    if (checked) ids.add(valueId)
    else ids.delete(valueId)
    update(draft.uid, { optionDefinitionValueIds: [...ids] })
  }

  return (
    <div className="flex flex-col gap-4">
      {catalog.isLoading && (
        <p className="text-[13.5px] text-muted" aria-busy="true">
          Loading options…
        </p>
      )}

      {catalog.isError && (
        <p className="text-[13.5px] text-danger">Could not load the option catalog.</p>
      )}

      {!catalog.isLoading && entries.length === 0 && (
        <p className="text-[13.5px] text-muted">
          No options yet.{' '}
          <Link route="admin.options.home" className={inlineLink}>
            Add options and values
          </Link>{' '}
          in the catalog first.
        </p>
      )}

      {drafts.length === 0 && entries.length > 0 && (
        <p className="text-[13.5px] text-muted">
          No options on this product. It is sold as a single variant until you add options from the
          catalog.
        </p>
      )}

      {drafts.map((draft, index) => {
        const definition = entries.find(({ id }) => id === draft.optionDefinitionId)
        const available = entries.filter(
          ({ id }) => id === draft.optionDefinitionId || !assignedDefinitionIds.has(id)
        )

        return (
          <div key={draft.uid} className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormSelectWithSearch
                  name={`option-definition-${draft.uid}`}
                  label={`Option ${index + 1}`}
                  value={draft.optionDefinitionId}
                  disabled={disabled || catalog.isLoading}
                  placeholder="Choose an option"
                  onChange={(optionDefinitionId) =>
                    update(draft.uid, {
                      optionDefinitionId,
                      optionDefinitionValueIds: [],
                    })
                  }
                  options={available.map(({ id, name }) => ({
                    value: id,
                    label: name,
                    searchText: name,
                  }))}
                />
              </div>
              <IconButton
                label={`Remove option ${index + 1}`}
                disabled={disabled}
                onClick={() => setRemoveDraft(draft)}
              >
                <Trash2 size={15} />
              </IconButton>
            </div>

            {definition && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-[13px] font-medium text-ink-2">
                  Values for this product
                </legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {definition.values.map((entry) => (
                    <FormSwitch
                      key={entry.id}
                      name={`option-value-${draft.uid}-${entry.id}`}
                      label={entry.value}
                      checked={draft.optionDefinitionValueIds.includes(entry.id)}
                      disabled={disabled}
                      onChange={(event) => toggleValue(draft, entry.id, event.target.checked)}
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )
      })}

      {error && <span className={field.error}>{error}</span>}

      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || !canAddOption}
            onClick={() => onChange([...drafts, emptyOptionPickerDraft()])}
          >
            <Plus size={15} /> Add option
          </FormButton>
          <Link route="admin.options.home" className={`text-[13px] ${inlineLink}`}>
            Manage catalog
          </Link>
        </div>
      )}

      <Dialog
        open={removeDraft !== null}
        onClose={() => setRemoveDraft(null)}
        title="Remove option?"
        description={
          removeDraft ? (
            <>
              Remove{' '}
              <strong className="font-medium text-ink">{removeDraftLabel(removeDraft)}</strong> from
              this product? You can add it again before you save.
            </>
          ) : null
        }
      >
        <form
          className="flex flex-wrap justify-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            confirmRemoveDraft()
          }}
        >
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRemoveDraft(null)}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" variant="danger" size="sm">
            Remove option
          </FormButton>
        </form>
      </Dialog>
    </div>
  )
}
