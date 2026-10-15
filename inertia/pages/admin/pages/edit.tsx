import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import { pageStatusMeta, policyLabels } from './_format'
import { useAdminPage, useArchiveAdminPage, useUnarchiveAdminPage } from './_hooks'
import PageForm from './_page_form'

function EditSkeleton() {
  return (
    <div className={`${card.base} flex flex-col gap-3`} aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function AdminPagesEdit({ id }: { id: string }) {
  const { data: page, isLoading, isError, refetch } = useAdminPage(id)
  const archive = useArchiveAdminPage()
  const unarchive = useUnarchiveAdminPage()
  const canEdit = useCan('pages.edit')
  const canArchive = useCan('pages.archive')

  const isArchived = page?.status === 'archived'
  const editable = canEdit && !isArchived

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive() {
    if (!page) return
    if (isArchived) {
      unarchive.mutate(page.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored as a draft`),
        onError,
      })
    } else {
      archive.mutate(page.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    }
  }

  const status = page ? pageStatusMeta[page.status] : null

  return (
    <Page
      eyebrow={
        <Link route="admin.pages.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Pages
        </Link>
      }
      title={page?.title ?? 'Page'}
      description={
        page &&
        status && (
          <span className="inline-flex flex-wrap gap-1.5">
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            {page.policyType && <Badge tone="info">{policyLabels[page.policyType]}</Badge>}
          </span>
        )
      }
      actions={
        page && (
          <>
            {page.status === 'active' && (
              <a
                href={`/pages/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: 'secondary', size: 'sm' })}
              >
                <ExternalLink size={15} /> View
              </a>
            )}
            {canArchive && (
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
            )}
          </>
        )
      }
    >
      {isLoading ? (
        <EditSkeleton />
      ) : isError || !page ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load this page.</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
            <Link
              route="admin.pages.home"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Back to pages
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This page is archived. Unarchive it to make changes.
            </p>
          )}
          <PageForm key={`${page.id}-${page.updatedAt ?? ''}`} page={page} editable={editable} />
        </div>
      )}
    </Page>
  )
}

AdminPagesEdit.layout = [AdminLayout]
