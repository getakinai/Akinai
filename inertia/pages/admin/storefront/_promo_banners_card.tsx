import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge, Dialog, IconButton, Skeleton } from '~/components/ui'
import { HttpError } from '~/lib/http'
import {
  MAX_PROMO_BANNERS_PER_PLACEMENT,
  PROMO_PLACEMENT_LABELS,
  type PromoPlacement,
} from '~/lib/storefront'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useDeleteAdminStorefrontPromoBanner,
  useReorderAdminStorefrontPromoBanners,
  useUpdateAdminStorefrontPromoBanner,
} from './_hooks'
import PromoBannerDialog from './_promo_banner_dialog'
import { isBrokenLink, linkPayload, linkTargetLabel, linkTargetProblem } from './_link'
import type { AdminStorefrontPromoBanner } from './_types'

type Editing = { banner: AdminStorefrontPromoBanner | null; key: number } | null

type PromoBannersCardProps = {
  placement: PromoPlacement
  banners: AdminStorefrontPromoBanner[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

/**
 * Why the banner is missing from the storefront, or null when it shows.
 */
function hiddenReason(banner: AdminStorefrontPromoBanner) {
  if (!banner.isVisible) return 'Hidden'
  return linkTargetProblem(banner)
}

/**
 * Promo banners for one spot on the home page. The section is hidden on
 * the storefront when none of its banners are shown.
 */
export default function PromoBannersCard({
  placement,
  banners,
  isLoading,
  isError,
  onRetry,
}: PromoBannersCardProps) {
  const canCreate = useCan('storefront.create')
  const canEdit = useCan('storefront.edit')
  const canDelete = useCan('storefront.archive')
  const reorder = useReorderAdminStorefrontPromoBanners()
  const update = useUpdateAdminStorefrontPromoBanner()
  const remove = useDeleteAdminStorefrontPromoBanner()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<AdminStorefrontPromoBanner | null>(null)

  const list = banners ?? []
  const isFull = list.length >= MAX_PROMO_BANNERS_PER_PLACEMENT
  const label = PROMO_PLACEMENT_LABELS[placement]

  function openDialog(banner: AdminStorefrontPromoBanner | null) {
    setEditing({ banner, key: Date.now() })
  }

  function move(index: number, offset: -1 | 1) {
    const ids = list.map(({ id }) => id)
    const target = index + offset
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate({ placement, ids }, { onError })
  }

  function toggleVisibility(banner: AdminStorefrontPromoBanner) {
    const next = !banner.isVisible
    const base = {
      id: banner.id,
      eyebrow: banner.eyebrow,
      title: banner.title,
      buttonLabel: banner.buttonLabel,
      tone: banner.tone,
      isVisible: next,
    }
    const payload = { ...base, ...linkPayload(banner) }
    update.mutate(payload, {
      onSuccess: () =>
        toast.success(next ? `${banner.title} is shown` : `${banner.title} is hidden`),
      onError,
    })
  }

  function confirmDelete() {
    if (!deleting) return
    const { id, title } = deleting
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(`${title} removed`)
        setDeleting(null)
      },
      onError,
    })
  }

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          <div className={card.eyebrow}>
            {list.length} of {MAX_PROMO_BANNERS_PER_PLACEMENT} banners
          </div>
          <h2 className={card.title}>Promo banners · {label}</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            This section is hidden on the storefront until a banner is shown.
          </p>
        </div>
        {canCreate && (
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFull || isLoading}
            title={
              isFull
                ? `This spot can hold at most ${MAX_PROMO_BANNERS_PER_PLACEMENT} banners`
                : undefined
            }
            onClick={() => openDialog(null)}
          >
            <Plus size={15} /> Add banner
          </FormButton>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading banners">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load the banners.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </FormButton>
        </div>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-muted">No banners yet.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {list.map((banner, index) => {
            const reason = hiddenReason(banner)
            const brokenLink = isBrokenLink(banner)
            return (
              <li key={banner.id} className="flex min-w-0 items-center gap-3 py-2.5">
                <span className="w-6 shrink-0 text-right font-mono text-[12px] text-subtle">
                  {index + 1}
                </span>
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-paper text-subtle max-[420px]:hidden">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-[13.5px] font-medium text-ink">
                      {banner.title}
                    </span>
                    {reason && (
                      <Badge tone={banner.isVisible ? 'warning' : 'neutral'} dot>
                        {reason}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[12px] text-muted">
                    {linkTargetLabel(banner)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {canEdit && (
                    <>
                      <IconButton
                        label={`Move ${banner.title} up`}
                        size="sm"
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp size={15} />
                      </IconButton>
                      <IconButton
                        label={`Move ${banner.title} down`}
                        size="sm"
                        disabled={index === list.length - 1 || reorder.isPending}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown size={15} />
                      </IconButton>
                      <IconButton
                        label={banner.isVisible ? `Hide ${banner.title}` : `Show ${banner.title}`}
                        size="sm"
                        disabled={brokenLink || update.isPending}
                        onClick={() => toggleVisibility(banner)}
                      >
                        {banner.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </IconButton>
                      <IconButton
                        label={`Edit ${banner.title}`}
                        size="sm"
                        onClick={() => openDialog(banner)}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    </>
                  )}
                  {canDelete && (
                    <IconButton
                      label={`Remove ${banner.title}`}
                      size="sm"
                      onClick={() => setDeleting(banner)}
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

      {editing && (
        <PromoBannerDialog
          key={editing.key}
          open
          placement={placement}
          banner={editing.banner}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove banner?"
        description={
          deleting
            ? `${deleting.title} and its image will be removed from the storefront. The linked page is not affected.`
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
    </section>
  )
}
