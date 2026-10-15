import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  FormButton,
  FormInput,
  FormInputNumber,
  FormSelectWithSearch,
  FormSwitch,
  FormTextarea,
} from '~/components/form'
import { Dialog, IconButton } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { HelpIcon } from '~/pages/help/_icons'
import { useCreateAdminHelpCategory, useUpdateAdminHelpCategory } from './_hooks'
import {
  AdminHelpCategoryFormSchema,
  HELP_ICONS,
  HelpIconSchema,
  MAX_HELP_GROUPS,
  type AdminHelpCategory,
  type HelpIconName,
} from './_types'

type CategoryDialogProps = {
  open: boolean
  category: AdminHelpCategory | null
  onClose: () => void
}

type GroupDraft = { key: string; id: string | null; title: string; position: number | null }

const ICON_LABELS: Record<HelpIconName, string> = {
  'rocket': 'Getting started',
  'shopping-bag': 'Shopping bag',
  'credit-card': 'Card',
  'truck': 'Delivery truck',
  'rotate-ccw': 'Return arrow',
  'user': 'Person',
  'help-circle': 'Question mark',
}

const iconOptions = HELP_ICONS.map((icon) => ({
  value: icon,
  label: ICON_LABELS[icon],
  icon: <HelpIcon name={icon} size={15} />,
}))

let draftKey = 0
const nextKey = () => `group-${++draftKey}`

/**
 * Creates a category when `category` is null, otherwise edits it.
 * Remount with a new `key` to reset the fields between categories.
 */
export default function CategoryDialog({ open, category, onClose }: CategoryDialogProps) {
  const [title, setTitle] = useState(category?.title ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [icon, setIcon] = useState<HelpIconName>(category?.icon ?? 'help-circle')
  const [popular, setPopular] = useState(category?.popular ?? false)
  const [position, setPosition] = useState<number | null>(category?.position ?? 0)
  const [groups, setGroups] = useState<GroupDraft[]>(
    (category?.groups ?? []).map((group) => ({
      key: group.id,
      id: group.id,
      title: group.title,
      position: group.position,
    }))
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const createCategory = useCreateAdminHelpCategory()
  const updateCategory = useUpdateAdminHelpCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  function updateGroup(key: string, patch: Partial<GroupDraft>) {
    setGroups((current) =>
      current.map((group) => (group.key === key ? { ...group, ...patch } : group))
    )
  }

  function addGroup() {
    const last = groups.at(-1)?.position ?? 0
    setGroups((current) => [
      ...current,
      { key: nextKey(), id: null, title: '', position: current.length === 0 ? 1 : last + 1 },
    ])
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminHelpCategoryFormSchema.safeParse({
      title,
      slug: emptyToNull(slug),
      description,
      icon,
      popular,
      position,
      groups: groups.map(({ id, title: groupTitle, position: groupPosition }) => ({
        id,
        title: groupTitle,
        position: groupPosition,
      })),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminHelpCategory) => {
        toast.success(category ? `${saved.title} updated` : `${saved.title} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (category) {
      updateCategory.mutate({ id: category.id, ...parsed.data }, options)
    } else {
      createCategory.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'Add category'}
      className="sm:max-w-[560px]"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="title"
          label="Title"
          placeholder="Payments"
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          autoFocus={!category}
        />
        <FormTextarea
          name="description"
          label="Description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="icon"
            label="Icon"
            value={icon}
            onChange={(next) => setIcon(HelpIconSchema.parse(next))}
            error={errors.icon}
            options={iconOptions}
          />
          <FormInputNumber
            name="position"
            label="Order"
            min={0}
            max={1000}
            step={1}
            value={position}
            onChange={setPosition}
            error={errors.position}
          />
        </div>
        <FormInput
          name="slug"
          label="URL handle"
          placeholder={category ? undefined : 'Generated from the title'}
          autoComplete="off"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          error={errors.slug}
          tooltip="The category lives at /help/<handle>. Changing it breaks links people saved."
        />
        <FormSwitch
          name="popular"
          label="Show on the help center home"
          checked={popular}
          onChange={(event) => setPopular(event.target.checked)}
          error={errors.popular}
          tooltip="Popular categories are listed first on /help."
        />

        <fieldset className="flex min-w-0 flex-col gap-3 rounded-md border border-line-2 p-4">
          <legend className="px-1 text-[13px] font-medium text-ink">Sections</legend>
          {groups.length === 0 && (
            <p className="text-[13px] text-muted">No sections. Articles are listed together.</p>
          )}
          {groups.map((group, index) => (
            <div key={group.key} className="flex min-w-0 items-end gap-2">
              <div className="min-w-0 flex-1">
                <FormInput
                  name={`groups-${group.key}-title`}
                  label={`Section ${index + 1} title`}
                  autoComplete="off"
                  value={group.title}
                  onChange={(event) => updateGroup(group.key, { title: event.target.value })}
                  error={errors[`groups.${index}.title`] ?? errors[`groups.${index}.id`]}
                />
              </div>
              <div className="w-20 flex-none">
                <FormInputNumber
                  name={`groups-${group.key}-position`}
                  label="Order"
                  min={0}
                  max={1000}
                  step={1}
                  value={group.position}
                  onChange={(next) => updateGroup(group.key, { position: next })}
                  error={errors[`groups.${index}.position`]}
                />
              </div>
              <IconButton
                label={`Remove section ${group.title || index + 1}`}
                size="sm"
                className="mb-1.5"
                onClick={() =>
                  setGroups((current) => current.filter((item) => item.key !== group.key))
                }
              >
                <Trash2 size={15} />
              </IconButton>
            </div>
          ))}
          {errors.groups && <span className="text-[12.5px] text-danger">{errors.groups}</span>}
          {groups.length < MAX_HELP_GROUPS && (
            <div>
              <FormButton type="button" variant="secondary" size="sm" onClick={addGroup}>
                <Plus size={15} /> Add section
              </FormButton>
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {category ? 'Save changes' : 'Create category'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
