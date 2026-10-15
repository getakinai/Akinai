import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { Archive, ArchiveRestore, ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import CollectionForm from './_collection_form'
import CoverImageCard from './_cover_image_card'
import { collectionStatusMeta, collectionTypeMeta } from './_format'
import {
  useAdminCollection,
  useArchiveAdminCollection,
  useUnarchiveAdminCollection,
} from './_hooks'
import ProductsCard from './_products_card'

function EditSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading collection">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className={`${card.base} flex flex-col gap-3`}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function AdminCollectionsEdit({ id }: { id: string }) {
  const { data: collection, isLoading, isError, refetch } = useAdminCollection(id)
  const archive = useArchiveAdminCollection()
  const unarchive = useUnarchiveAdminCollection()
  const canEdit = useCan('collections.edit')
  const canArchive = useCan('collections.archive')

  const isArchived = collection?.status === 'archived'
  const editable = canEdit && !isArchived

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive() {
    if (!collection) return
    if (isArchived) {
      unarchive.mutate(collection.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored as a draft`),
        onError,
      })
    } else {
      archive.mutate(collection.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    }
  }

  const status = collection ? collectionStatusMeta[collection.status] : null
  const type = collection ? collectionTypeMeta[collection.type] : null

  return (
    <Page
      eyebrow={
        <Link
          route="admin.collections.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Collections
        </Link>
      }
      title={collection?.title ?? 'Collection'}
      description={
        status &&
        type && (
          <span className="inline-flex flex-wrap gap-1.5">
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            <Badge tone={type.tone}>{type.label}</Badge>
          </span>
        )
      }
      actions={
        collection &&
        canArchive && (
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            loading={archive.isPending || unarchive.isPending}
            onClick={onToggleArchive}
          >
            {isArchived ? (
              <>
                <ArchiveRestore size={15} /> Unarchive
              </>
            ) : (
              <>
                <Archive size={15} /> Archive
              </>
            )}
          </FormButton>
        )
      }
    >
      {isLoading ? (
        <EditSkeleton />
      ) : isError || !collection ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load this collection.</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
            <Link
              route="admin.collections.home"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Back to collections
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This collection is archived. Unarchive it to make changes.
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[1100px]:items-start">
            <CollectionForm
              key={`${collection.id}-${collection.updatedAt ?? ''}`}
              collection={collection}
              editable={editable}
            />
            <div className="flex min-w-0 flex-col gap-6">
              <CoverImageCard collection={collection} editable={editable} />
              <ProductsCard collection={collection} editable={editable} />
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

AdminCollectionsEdit.layout = [AdminLayout]
