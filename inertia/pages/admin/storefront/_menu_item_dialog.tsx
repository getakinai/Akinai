import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { type MenuItemType } from '~/lib/storefront'
import { useCreateAdminStorefrontMenuItem, useUpdateAdminStorefrontMenuItem } from './_hooks'
import LinkTargetFields from './_link_target_fields'
import { AdminStorefrontMenuItemFormSchema, type AdminStorefrontMenuItem } from './_types'

type MenuItemDialogProps = {
  open: boolean
  item: AdminStorefrontMenuItem | null
  onClose: () => void
}

/**
 * Adds a menu item when `item` is null, otherwise edits it. Remount with a
 * new `key` to reset the fields between items.
 */
export default function MenuItemDialog({ open, item, onClose }: MenuItemDialogProps) {
  const [type, setType] = useState<MenuItemType>(item?.type ?? 'collection')
  const [label, setLabel] = useState(item?.label ?? '')
  const [collectionId, setCollectionId] = useState(item?.collectionId ?? '')
  const [pageId, setPageId] = useState(item?.pageId ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [isVisible, setIsVisible] = useState(item?.isVisible ?? true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const createItem = useCreateAdminStorefrontMenuItem()
  const updateItem = useUpdateAdminStorefrontMenuItem()
  const isPending = createItem.isPending || updateItem.isPending

  function onTargetTitleChange(next: string | undefined, previous: string | undefined) {
    if (next && (label.trim() === '' || label === previous)) setLabel(next)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontMenuItemFormSchema.safeParse({
      type,
      label,
      collectionId: type === 'collection' ? collectionId : null,
      pageId: type === 'page' ? pageId : null,
      url: type === 'url' ? url : null,
      isVisible,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminStorefrontMenuItem) => {
        toast.success(item ? `${saved.label} updated` : `${saved.label} added to the menu`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (item) updateItem.mutate({ id: item.id, ...parsed.data }, options)
    else createItem.mutate(parsed.data, options)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? 'Edit menu item' : 'Add menu item'}
      description="Menu items appear in the storefront header, in the order shown on this page."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <LinkTargetFields
          name="menuItem"
          open={open}
          type={type}
          onTypeChange={(next) => {
            setType(next)
            setErrors({})
          }}
          collectionId={collectionId}
          onCollectionChange={setCollectionId}
          pageId={pageId}
          onPageChange={setPageId}
          url={url}
          onUrlChange={setUrl}
          errors={errors}
          onTargetTitleChange={onTargetTitleChange}
          draftHint={{
            collection: 'Draft collections stay hidden from the menu until they are active.',
            page: 'Draft pages stay hidden from the menu until they are active.',
          }}
        />

        <FormInput
          name="menuItemLabel"
          label="Label"
          placeholder="Shown in the menu"
          autoComplete="off"
          maxLength={60}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={errors.label}
        />

        <FormSwitch
          name="menuItemVisible"
          label="Show in the storefront menu"
          checked={isVisible}
          onChange={(event) => setIsVisible(event.target.checked)}
          error={errors.isVisible}
        />

        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {item ? 'Save changes' : 'Add item'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
