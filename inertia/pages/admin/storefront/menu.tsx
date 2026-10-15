import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Link2,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Dialog, IconButton, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { type MenuItemType } from '~/lib/storefront'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminStorefrontMenu,
  useDeleteAdminStorefrontMenuItem,
  useReorderAdminStorefrontMenu,
  useUpdateAdminStorefrontMenuItem,
} from './_hooks'
import MenuItemDialog from './_menu_item_dialog'
import { isBrokenLink, linkPayload, linkTargetLabel, linkTargetProblem } from './_link'
import { type AdminStorefrontMenuItem } from './_types'

type Editing = { item: AdminStorefrontMenuItem | null; key: number } | null

const LINK_ICONS: Record<MenuItemType, LucideIcon> = {
  collection: Layers,
  page: FileText,
  url: Link2,
}

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

/**
 * Why the item is missing from the storefront menu, or null when it shows.
 */
function hiddenReason(item: AdminStorefrontMenuItem) {
  if (!item.isVisible) return 'Hidden'
  return linkTargetProblem(item)
}

export default function StorefrontMenuPage() {
  const { data: items, isLoading, isError, refetch } = useAdminStorefrontMenu()
  const canCreate = useCan('storefront.create')
  const canEdit = useCan('storefront.edit')
  const canDelete = useCan('storefront.archive')
  const reorder = useReorderAdminStorefrontMenu()
  const update = useUpdateAdminStorefrontMenuItem()
  const remove = useDeleteAdminStorefrontMenuItem()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<AdminStorefrontMenuItem | null>(null)

  const list = items ?? []

  function openDialog(item: AdminStorefrontMenuItem | null) {
    setEditing({ item, key: Date.now() })
  }

  function move(index: number, offset: -1 | 1) {
    const ids = list.map(({ id }) => id)
    const target = index + offset
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids, { onError })
  }

  function toggleVisibility(item: AdminStorefrontMenuItem) {
    const next = !item.isVisible
    const base = { id: item.id, label: item.label, isVisible: next }
    const payload = { ...base, ...linkPayload(item) }
    update.mutate(payload, {
      onSuccess: () =>
        toast.success(next ? `${item.label} is shown in the menu` : `${item.label} is hidden`),
      onError,
    })
  }

  function confirmDelete() {
    if (!deleting) return
    const { id, label } = deleting
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(`${label} removed from the menu`)
        setDeleting(null)
      },
      onError,
    })
  }

  return (
    <Page
      title="Storefront menu"
      description="Choose which links appear in the storefront header and in what order."
      actions={
        <>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            View storefront <ExternalLink size={14} />
          </a>
          {canCreate && (
            <FormButton type="button" size="sm" onClick={() => openDialog(null)}>
              <Plus size={15} /> Add menu item
            </FormButton>
          )}
        </>
      }
    >
      <section className={card.base}>
        <div className={card.head}>
          <div className="min-w-0">
            <div className={card.eyebrow}>
              {list.length} {list.length === 1 ? 'item' : 'items'}
            </div>
            <h2 className={card.title}>Header menu</h2>
            {canEdit && (
              <p className="mt-1 text-[13px] text-pretty text-muted">
                Use the arrows to set the order shoppers see.
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading menu">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-[14px] text-muted">Could not load the menu.</span>
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            The menu is empty. Add a collection, a page or a custom link to get started.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {list.map((item, index) => {
              const reason = hiddenReason(item)
              const Icon = LINK_ICONS[item.type]
              const brokenLink = isBrokenLink(item)
              return (
                <li key={item.id} className="flex min-w-0 items-center gap-3 py-2.5">
                  <span className="w-6 shrink-0 text-right font-mono text-[12px] text-subtle">
                    {index + 1}
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper text-muted max-[420px]:hidden">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-[13.5px] font-medium text-ink">
                        {item.label}
                      </span>
                      {reason && (
                        <Badge tone={item.isVisible ? 'warning' : 'neutral'} dot>
                          {reason}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[12px] text-muted">
                      {linkTargetLabel(item)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {canEdit && (
                      <>
                        <IconButton
                          label={`Move ${item.label} up`}
                          size="sm"
                          disabled={index === 0 || reorder.isPending}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp size={15} />
                        </IconButton>
                        <IconButton
                          label={`Move ${item.label} down`}
                          size="sm"
                          disabled={index === list.length - 1 || reorder.isPending}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown size={15} />
                        </IconButton>
                        <IconButton
                          label={item.isVisible ? `Hide ${item.label}` : `Show ${item.label}`}
                          size="sm"
                          disabled={brokenLink || update.isPending}
                          onClick={() => toggleVisibility(item)}
                        >
                          {item.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </IconButton>
                        <IconButton
                          label={`Edit ${item.label}`}
                          size="sm"
                          onClick={() => openDialog(item)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      </>
                    )}
                    {canDelete && (
                      <IconButton
                        label={`Remove ${item.label}`}
                        size="sm"
                        onClick={() => setDeleting(item)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {editing && (
        <MenuItemDialog
          key={editing.key}
          open
          item={editing.item}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove menu item?"
        description={
          deleting
            ? `${deleting.label} will be removed from the storefront menu. The linked page is not affected.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={() => setDeleting(null)}>
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            size="sm"
            loading={remove.isPending}
            onClick={confirmDelete}
          >
            Remove
          </FormButton>
        </div>
      </Dialog>
    </Page>
  )
}

StorefrontMenuPage.layout = [AdminLayout]
