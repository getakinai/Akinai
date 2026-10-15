import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { Copy, ImageIcon, Trash2, Upload } from 'lucide-react'
import Page from '~/components/page'
import { DataTableToolbar } from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Dialog, SearchInput, Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, cn, listToolbarSearch } from '~/lib/styles'
import { useIsAdmin } from '../_hooks'
import { useAdminMediaInfinite, useDeleteAdminMedia, useUploadAdminMedia } from './_hooks'
import {
  AdminMediaFolderFilterSchema,
  MAX_MEDIA_FILES_PER_UPLOAD,
  MAX_MEDIA_UPLOAD_SIZE_MB,
  MEDIA_ACCEPT,
  MEDIA_FOLDER_OPTIONS,
  type AdminMedia,
  type AdminMediaFolderFilter,
} from './_types'

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileName(media: AdminMedia) {
  return media.originalName ?? media.key.split('/').pop() ?? media.key
}

export default function AdminMediaHome() {
  const [q, setQ] = useState('')
  const [folder, setFolder] = useState<AdminMediaFolderFilter>('')
  const [selected, setSelected] = useState<AdminMedia | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const list = useAdminMediaInfinite({ q, folder })
  const upload = useUploadAdminMedia()

  function onFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    if (files.length > MAX_MEDIA_FILES_PER_UPLOAD) {
      return toast.error(`Upload at most ${MAX_MEDIA_FILES_PER_UPLOAD} images at a time`)
    }
    const tooLarge = files.find((file) => file.size > MAX_MEDIA_UPLOAD_SIZE_MB * 1024 * 1024)
    if (tooLarge) {
      return toast.error(`${tooLarge.name} is larger than ${MAX_MEDIA_UPLOAD_SIZE_MB}MB`)
    }
    upload.mutate(files, {
      onSuccess: ({ count }) =>
        toast.success(count === 1 ? 'Image uploaded' : `${count} images uploaded`),
      onError: (error) => {
        if (!(error instanceof HttpError)) return toast.error('Something went wrong')
        const fieldError = Object.values(error.fieldErrors)[0]
        toast.error(fieldError ?? error.message)
      },
    })
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    onFiles(event.dataTransfer.files)
  }

  return (
    <Page
      eyebrow="Back office"
      title="Media"
      description="Every image uploaded to the store"
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            multiple
            hidden
            onChange={(event) => {
              onFiles(event.target.files)
              event.target.value = ''
            }}
          />
          <FormButton
            type="button"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={15} /> {upload.isPending ? 'Uploading…' : 'Upload'}
          </FormButton>
        </>
      }
    >
      <section
        className={cn(card.base, dragging && 'ring-3 ring-ring')}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <DataTableToolbar
          left={
            <SearchInput
              label="Search media"
              placeholder="Search by file name…"
              value={q}
              onDebouncedChange={setQ}
              className={listToolbarSearch}
            />
          }
          right={
            <FormSelectWithSearch
              name="media-folder-filter"
              label="Filter by type"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={folder}
              onChange={(next) => setFolder(AdminMediaFolderFilterSchema.parse(next))}
              options={[...MEDIA_FOLDER_OPTIONS]}
            />
          }
        />

        <MediaGrid list={list} onSelect={setSelected} filtered={!!q || !!folder} />

        <p className="mt-4 text-center text-[12.5px] text-subtle">
          Drop images here to upload. PNG, JPG, WebP or GIF, up to {MAX_MEDIA_UPLOAD_SIZE_MB}MB
          each.
        </p>
      </section>

      {selected && (
        <MediaDialog key={selected.id} media={selected} onClose={() => setSelected(null)} />
      )}
    </Page>
  )
}

AdminMediaHome.layout = [AdminLayout]

function MediaGrid({
  list,
  onSelect,
  filtered,
}: {
  list: ReturnType<typeof useAdminMediaInfinite>
  onSelect: (media: AdminMedia) => void
  filtered: boolean
}) {
  if (list.isPending) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }
  if (list.isError) {
    return <p className="py-10 text-center text-[13.5px] text-muted">Could not load media.</p>
  }
  if (list.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-muted">
        <ImageIcon size={28} strokeWidth={1.5} />
        <p className="text-[13.5px]">
          {filtered ? 'No images match your filters.' : 'No images uploaded yet.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {list.rows.map((media) => (
          <li key={media.id}>
            <button
              type="button"
              onClick={() => onSelect(media)}
              className="group block aspect-square w-full overflow-hidden rounded-lg border border-line bg-paper focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Open ${fileName(media)}`}
            >
              <img
                src={media.url}
                alt=""
                loading="lazy"
                className="size-full object-contain transition-transform duration-150 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-subtle">
        <span>
          Showing {list.rows.length} of {list.total}
        </span>
        {list.hasNextPage && (
          <FormButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            {list.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </FormButton>
        )}
      </div>
    </>
  )
}

function MediaDialog({ media, onClose }: { media: AdminMedia; onClose: () => void }) {
  const isAdmin = useIsAdmin()
  const { formatDateTime } = useDateFormat()
  const remove = useDeleteAdminMedia()
  const [confirming, setConfirming] = useState(false)
  const [blocked, setBlocked] = useState<string>()

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(new URL(media.url, window.location.origin).toString())
      toast.success('URL copied')
    } catch {
      toast.error('Could not copy the URL')
    }
  }

  function onDelete() {
    remove.mutate(media.id, {
      onSuccess: () => {
        toast.success('Image deleted')
        onClose()
      },
      onError: (error) => {
        setConfirming(false)
        if (error instanceof HttpError && error.status === 422) return setBlocked(error.message)
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
      },
    })
  }

  const details = [
    { label: 'File', value: fileName(media) },
    { label: 'Folder', value: media.folder || '—' },
    { label: 'Size', value: formatBytes(media.sizeBytes) },
    {
      label: 'Dimensions',
      value: media.width && media.height ? `${media.width} × ${media.height}` : 'Unknown',
    },
    { label: 'Uploaded by', value: media.uploadedBy?.fullName ?? 'Unknown' },
    { label: 'Uploaded', value: formatDateTime(media.createdAt) },
  ]

  return (
    <Dialog open onClose={onClose} title={fileName(media)} className="w-[min(640px,92vw)]">
      <div className="grid max-h-[50vh] place-items-center overflow-hidden rounded-lg border border-line bg-paper">
        <img src={media.url} alt="" className="max-h-[50vh] w-auto object-contain" />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {details.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-subtle">{label}</dt>
            <dd className="min-w-0 truncate text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {blocked && (
        <p className="rounded-lg border border-line bg-paper px-3 py-2 text-[13px] text-muted">
          {blocked}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FormButton type="button" size="sm" variant="secondary" onClick={onCopy}>
          <Copy size={15} /> Copy URL
        </FormButton>
        {isAdmin &&
          (confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted">Delete permanently?</span>
              <FormButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </FormButton>
              <FormButton
                type="button"
                size="sm"
                variant="danger"
                disabled={remove.isPending}
                onClick={onDelete}
              >
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </FormButton>
            </div>
          ) : (
            <FormButton
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                setBlocked(undefined)
                setConfirming(true)
              }}
            >
              <Trash2 size={15} /> Delete
            </FormButton>
          ))}
      </div>
    </Dialog>
  )
}
