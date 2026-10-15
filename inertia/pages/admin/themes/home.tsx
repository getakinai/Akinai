import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Eye, LayoutTemplate, Paintbrush, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Dialog, Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card, cn } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  adminThemePreviewUrl,
  useAdminThemes,
  useDeleteAdminTheme,
  usePublishAdminTheme,
  useUnpublishAdminTheme,
  useUploadAdminTheme,
} from './_hooks'
import type { AdminTheme } from './_types'

const MAX_UPLOAD_MB = 10

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

function Thumbnail({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-paper text-subtle sm:w-44">
      {url ? (
        <img src={url} alt={`${name} preview`} className="size-full object-cover" />
      ) : (
        <LayoutTemplate size={28} aria-hidden="true" />
      )}
    </div>
  )
}

function ThemeRow({
  title,
  badges,
  meta,
  description,
  thumbnail,
  actions,
}: {
  title: string
  badges: ReactNode
  meta: ReactNode
  description?: string | null
  thumbnail: ReactNode
  actions: ReactNode
}) {
  return (
    <li className="flex min-w-0 flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row">
      {thumbnail}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{title}</h3>
            {badges}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">{meta}</div>
          {description && <p className="mt-2 text-[13px] text-pretty text-muted">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </li>
  )
}

function UploadCard() {
  const upload = useUploadAdminTheme()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [problems, setProblems] = useState<string[]>([])

  function send(file: File | undefined) {
    if (!file) return
    setProblems([])
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setProblems(['Choose a .zip file'])
      return
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setProblems([`Theme files may be at most ${MAX_UPLOAD_MB} MB`])
      return
    }
    upload.mutate(file, {
      onSuccess: (theme) => toast.success(`${theme.name} added to your theme library`),
      onError: (error) =>
        setProblems(
          error instanceof HttpError ? error.messages : ['The theme could not be uploaded']
        ),
    })
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    send(event.dataTransfer.files[0])
  }

  return (
    <section className={card.base} aria-labelledby="theme-upload-title">
      <h2 id="theme-upload-title" className={card.title}>
        Add a theme
      </h2>
      <p className="mt-1 text-[13px] text-muted">
        Upload a theme .zip. It is added to your library unpublished, so you can preview it first.
      </p>
      <div
        className={cn(
          'mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-2 bg-paper px-4 py-8 text-center',
          dragging && 'border-accent bg-accent-soft'
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload size={20} className="text-muted" aria-hidden="true" />
        <p className="text-[13.5px] text-ink">Drop a theme .zip here, or</p>
        <FormButton
          type="button"
          variant="secondary"
          size="sm"
          loading={upload.isPending}
          onClick={() => input.current?.click()}
        >
          Choose file
        </FormButton>
        <p className="text-[12px] text-subtle">Up to {MAX_UPLOAD_MB} MB</p>
        <input
          ref={input}
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          aria-label="Theme file"
          onChange={(event) => {
            send(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      {problems.length > 0 && (
        <div role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3">
          <p className="text-[13px] font-medium text-danger">
            This theme can’t be installed. Fix these problems and upload it again:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] break-words text-danger">
            {problems.slice(0, 30).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          {problems.length > 30 && (
            <p className="mt-2 text-[12.5px] text-danger">…and {problems.length - 30} more.</p>
          )}
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 text-[12.5px] text-muted">
        <ShieldAlert size={15} className="mt-px shrink-0 text-warning" aria-hidden="true" />
        Themes run on your server. Only install themes from authors you trust.
      </p>
    </section>
  )
}

export default function AdminThemesPage() {
  const { data: themes, isLoading, isError, refetch } = useAdminThemes()
  const canEdit = useCan('themes.edit')
  const canUpload = useCan('themes.upload')
  const canDelete = useCan('themes.archive')
  const canEditBuiltin = useCan('storefront.view')
  const { formatDate } = useDateFormat()
  const publish = usePublishAdminTheme()
  const unpublish = useUnpublishAdminTheme()
  const remove = useDeleteAdminTheme()
  const [publishing, setPublishing] = useState<AdminTheme | 'builtin' | null>(null)
  const [deleting, setDeleting] = useState<AdminTheme | null>(null)
  const [previewing, setPreviewing] = useState<{ id: string | 'builtin'; name: string } | null>(
    null
  )

  function closePreview() {
    setPreviewing(null)
    void fetch('/themes/preview/exit', { credentials: 'include', redirect: 'manual' })
  }

  const live = themes?.find((theme) => theme.role === 'live') ?? null
  const library = themes?.filter((theme) => theme.role !== 'live') ?? []

  function meta(theme: AdminTheme) {
    const parts = [`Version ${theme.version}`]
    if (theme.author) parts.push(`by ${theme.author}`)
    parts.push(
      theme.role === 'live' && theme.publishedAt
        ? `Published ${formatDate(theme.publishedAt)}`
        : `Added ${formatDate(theme.createdAt)}${theme.uploadedBy ? ` by ${theme.uploadedBy.fullName}` : ''}`
    )
    return parts.join(' · ')
  }

  function confirmPublish() {
    if (!publishing) return
    if (publishing === 'builtin') {
      if (!live) return
      unpublish.mutate(live.id, {
        onSuccess: () => {
          toast.success('The built-in theme is live')
          setPublishing(null)
        },
        onError,
      })
      return
    }
    const theme = publishing
    publish.mutate(theme.id, {
      onSuccess: () => {
        toast.success(`${theme.name} is live`)
        setPublishing(null)
      },
      onError,
    })
  }

  const previewButton = (id: string | 'builtin', name: string) => (
    <FormButton
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setPreviewing({ id, name })}
    >
      <Eye size={14} /> Preview
    </FormButton>
  )

  const builtinCustomize = canEditBuiltin && (
    <Link
      route="admin.storefront_theme.home"
      className={buttonClasses({ variant: 'secondary', size: 'sm' })}
    >
      <Paintbrush size={14} /> Customize
    </Link>
  )

  const builtinRow = (isLive: boolean) => (
    <ThemeRow
      key="builtin"
      title="Built-in theme"
      badges={
        <>
          {isLive && (
            <Badge tone="success" dot>
              Live
            </Badge>
          )}
          <Badge tone="neutral">Built in</Badge>
        </>
      }
      meta="Comes with your store · colors and content are set when you customize it"
      thumbnail={<Thumbnail url={null} name="Built-in theme" />}
      actions={
        <>
          {!isLive && canEdit && (
            <FormButton type="button" size="sm" onClick={() => setPublishing('builtin')}>
              Publish
            </FormButton>
          )}
          {builtinCustomize}
          {!isLive && previewButton('builtin', 'Built-in theme')}
        </>
      }
    />
  )

  const themeRow = (theme: AdminTheme) => {
    const isLive = theme.role === 'live'
    return (
      <ThemeRow
        key={theme.id}
        title={theme.name}
        badges={
          <>
            {isLive && (
              <Badge tone="success" dot>
                Live
              </Badge>
            )}
            {theme.source === 'bundled' && <Badge tone="info">Included</Badge>}
          </>
        }
        meta={meta(theme)}
        description={theme.description}
        thumbnail={<Thumbnail url={theme.previewImageUrl} name={theme.name} />}
        actions={
          <>
            {!isLive && canEdit && (
              <FormButton type="button" size="sm" onClick={() => setPublishing(theme)}>
                Publish
              </FormButton>
            )}
            {previewButton(theme.id, theme.name)}
            {canEdit && (
              <a
                href={`/admin/themes/${encodeURIComponent(theme.id)}/editor`}
                className={buttonClasses({ variant: 'secondary', size: 'sm' })}
              >
                <Paintbrush size={14} /> Customize
              </a>
            )}
            {!isLive && canDelete && (
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleting(theme)}
              >
                <Trash2 size={14} /> Delete
              </FormButton>
            )}
          </>
        }
      />
    )
  }

  return (
    <Page
      title="Themes"
      description="Choose how your online store looks. Preview a theme before you publish it; shoppers only see the live theme."
    >
      {isLoading ? (
        <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading themes">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className={card.base}>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-[14px] text-muted">Could not load the themes.</span>
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-5">
          <section className={card.base} aria-labelledby="live-theme-title">
            <h2 id="live-theme-title" className={card.title}>
              Live theme
            </h2>
            <ul className="mt-4">{live ? themeRow(live) : builtinRow(true)}</ul>
            {live && canEdit && (
              <p className="mt-4 text-[12.5px] text-muted">
                Pages this theme doesn’t include (such as checkout and accounts) use the built-in
                theme.{' '}
                <button
                  type="button"
                  className="font-medium text-ink underline-offset-2 hover:underline"
                  onClick={() => setPublishing('builtin')}
                >
                  Switch back to the built-in theme
                </button>
              </p>
            )}
          </section>

          <section className={card.base} aria-labelledby="theme-library-title">
            <h2 id="theme-library-title" className={card.title}>
              Theme library
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Themes you’ve added. They stay unpublished until you publish one.
            </p>
            {library.length === 0 && !live ? (
              <p className="mt-4 text-[13px] text-muted">No other themes yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {live && builtinRow(false)}
                {library.map(themeRow)}
              </ul>
            )}
          </section>

          {canUpload && <UploadCard />}
        </div>
      )}

      <Dialog
        open={previewing !== null}
        onClose={closePreview}
        title={previewing ? `Preview · ${previewing.name}` : 'Preview'}
        className="app-dialog--wide"
      >
        {previewing && (
          <iframe
            key={previewing.id}
            title={`Preview of ${previewing.name}`}
            src={adminThemePreviewUrl(previewing.id)}
            className="h-[min(75dvh,720px)] w-full rounded-lg border border-line bg-paper"
          />
        )}
      </Dialog>

      <Dialog
        open={publishing !== null}
        onClose={() => setPublishing(null)}
        title="Publish theme?"
        description={
          publishing === 'builtin'
            ? 'Shoppers will see the built-in theme right away. The current live theme moves back to your library.'
            : publishing
              ? `Shoppers will see ${publishing.name} right away. ${live ? `${live.name} moves back to your library.` : 'The built-in theme stays available in your library.'}`
              : undefined
        }
      >
        <div className="flex justify-end gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPublishing(null)}
          >
            Cancel
          </FormButton>
          <FormButton
            type="button"
            size="sm"
            loading={publish.isPending || unpublish.isPending}
            onClick={confirmPublish}
          >
            Publish
          </FormButton>
        </div>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete theme?"
        description={
          deleting
            ? `${deleting.name} and its settings will be removed from your library.`
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
            onClick={() => {
              if (!deleting) return
              const theme = deleting
              remove.mutate(theme.id, {
                onSuccess: () => {
                  toast.success(`${theme.name} deleted`)
                  setDeleting(null)
                },
                onError,
              })
            }}
          >
            Delete
          </FormButton>
        </div>
      </Dialog>
    </Page>
  )
}

AdminThemesPage.layout = [AdminLayout]
