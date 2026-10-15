import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Dialog, IconButton, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminStorefrontHeroSlides,
  useDeleteAdminStorefrontHeroSlide,
  useReorderAdminStorefrontHeroSlides,
  useUpdateAdminStorefrontHeroSlide,
} from './_hooks'
import HeroSlideDialog from './_hero_slide_dialog'
import { isBrokenLink, linkPayload, linkTargetLabel, linkTargetProblem } from './_link'
import { MAX_HERO_SLIDES, type AdminStorefrontHeroSlide } from './_types'

type Editing = { slide: AdminStorefrontHeroSlide | null; key: number } | null

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

/**
 * Why the slide is missing from the storefront hero, or null when it shows.
 */
function hiddenReason(slide: AdminStorefrontHeroSlide) {
  if (!slide.isVisible) return 'Hidden'
  return linkTargetProblem(slide)
}

export default function StorefrontHeroPage() {
  const { data: slides, isLoading, isError, refetch } = useAdminStorefrontHeroSlides()
  const canCreate = useCan('storefront.create')
  const canEdit = useCan('storefront.edit')
  const canDelete = useCan('storefront.archive')
  const reorder = useReorderAdminStorefrontHeroSlides()
  const update = useUpdateAdminStorefrontHeroSlide()
  const remove = useDeleteAdminStorefrontHeroSlide()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<AdminStorefrontHeroSlide | null>(null)

  const list = slides ?? []
  const isFull = list.length >= MAX_HERO_SLIDES

  function openDialog(slide: AdminStorefrontHeroSlide | null) {
    setEditing({ slide, key: Date.now() })
  }

  function move(index: number, offset: -1 | 1) {
    const ids = list.map(({ id }) => id)
    const target = index + offset
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids, { onError })
  }

  function toggleVisibility(slide: AdminStorefrontHeroSlide) {
    const next = !slide.isVisible
    const base = {
      id: slide.id,
      eyebrow: slide.eyebrow,
      heading: slide.heading,
      subheading: slide.subheading,
      buttonLabel: slide.buttonLabel,
      isVisible: next,
    }
    const payload = { ...base, ...linkPayload(slide) }
    update.mutate(payload, {
      onSuccess: () =>
        toast.success(
          next ? `${slide.heading} is shown in the hero` : `${slide.heading} is hidden`
        ),
      onError,
    })
  }

  function confirmDelete() {
    if (!deleting) return
    const { id, heading } = deleting
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(`${heading} removed from the hero`)
        setDeleting(null)
      },
      onError,
    })
  }

  return (
    <Page
      title="Storefront hero"
      description="Choose the slides that rotate at the top of the storefront home page."
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
            <FormButton
              type="button"
              size="sm"
              disabled={isFull}
              title={isFull ? `The hero can hold at most ${MAX_HERO_SLIDES} slides` : undefined}
              onClick={() => openDialog(null)}
            >
              <Plus size={15} /> Add slide
            </FormButton>
          )}
        </>
      }
    >
      <section className={card.base}>
        <div className={card.head}>
          <div className="min-w-0">
            <div className={card.eyebrow}>
              {list.length} {list.length === 1 ? 'slide' : 'slides'}
            </div>
            <h2 className={card.title}>Hero slides</h2>
            <p className="mt-1 text-[13px] text-pretty text-muted">
              When no slide is shown, the storefront uses the default hero.
              {canEdit && ' Use the arrows to set the order shoppers see.'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading slides">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-[14px] text-muted">Could not load the slides.</span>
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            No slides yet. Add one to replace the default hero.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {list.map((slide, index) => {
              const reason = hiddenReason(slide)
              const brokenLink = isBrokenLink(slide)
              return (
                <li key={slide.id} className="flex min-w-0 items-center gap-3 py-2.5">
                  <span className="w-6 shrink-0 text-right font-mono text-[12px] text-subtle">
                    {index + 1}
                  </span>
                  <span className="grid aspect-video w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-paper text-subtle max-[420px]:hidden">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-[13.5px] font-medium text-ink">
                        {slide.heading}
                      </span>
                      {reason && (
                        <Badge tone={slide.isVisible ? 'warning' : 'neutral'} dot>
                          {reason}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[12px] text-muted">
                      {linkTargetLabel(slide)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {canEdit && (
                      <>
                        <IconButton
                          label={`Move ${slide.heading} up`}
                          size="sm"
                          disabled={index === 0 || reorder.isPending}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp size={15} />
                        </IconButton>
                        <IconButton
                          label={`Move ${slide.heading} down`}
                          size="sm"
                          disabled={index === list.length - 1 || reorder.isPending}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown size={15} />
                        </IconButton>
                        <IconButton
                          label={
                            slide.isVisible ? `Hide ${slide.heading}` : `Show ${slide.heading}`
                          }
                          size="sm"
                          disabled={brokenLink || update.isPending}
                          onClick={() => toggleVisibility(slide)}
                        >
                          {slide.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </IconButton>
                        <IconButton
                          label={`Edit ${slide.heading}`}
                          size="sm"
                          onClick={() => openDialog(slide)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      </>
                    )}
                    {canDelete && (
                      <IconButton
                        label={`Remove ${slide.heading}`}
                        size="sm"
                        onClick={() => setDeleting(slide)}
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
        <HeroSlideDialog
          key={editing.key}
          open
          slide={editing.slide}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove slide?"
        description={
          deleting
            ? `${deleting.heading} and its image will be removed from the storefront hero. The linked page is not affected.`
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

StorefrontHeroPage.layout = [AdminLayout]
