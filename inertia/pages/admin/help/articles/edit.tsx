import { Link } from '@adonisjs/inertia/react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, ArrowLeft, ExternalLink } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../../_hooks'
import ArticleForm from './_article_form'
import { helpArticleStatusMeta } from './_format'
import {
  useAdminHelpArticle,
  useArchiveAdminHelpArticle,
  useUnarchiveAdminHelpArticle,
} from './_hooks'

function EditSkeleton() {
  return (
    <div
      className={`${card.base} flex flex-col gap-3`}
      aria-busy="true"
      aria-label="Loading article"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function AdminHelpArticlesEdit({ id }: { id: string }) {
  const { data: article, isLoading, isError, refetch } = useAdminHelpArticle(id)
  const archive = useArchiveAdminHelpArticle()
  const unarchive = useUnarchiveAdminHelpArticle()
  const canEdit = useCan('help_articles.edit')
  const canArchive = useCan('help_articles.archive')

  const isArchived = article?.status === 'archived'
  const editable = canEdit && !isArchived

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive() {
    if (!article) return
    if (isArchived) {
      unarchive.mutate(article.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored as a draft`),
        onError,
      })
    } else {
      archive.mutate(article.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    }
  }

  const status = article ? helpArticleStatusMeta[article.status] : null

  return (
    <Page
      eyebrow={
        <Link
          route="admin.help_articles.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Help center
        </Link>
      }
      title={article?.title ?? 'Help article'}
      description={
        article &&
        status && (
          <span className="inline-flex flex-wrap gap-1.5">
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            {article.category && <Badge tone="neutral">{article.category.title}</Badge>}
            {article.popular && <Badge tone="info">Popular</Badge>}
          </span>
        )
      }
      actions={
        article && (
          <>
            {article.status === 'active' && article.category && (
              <a
                href={`/help/${article.category.slug}/${article.slug}`}
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
      ) : isError || !article ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load this article.</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
            <Link
              route="admin.help_articles.home"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Back to help center
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This article is archived. Unarchive it to make changes.
            </p>
          )}
          <ArticleForm
            key={`${article.id}-${article.updatedAt ?? ''}`}
            article={article}
            editable={editable}
          />
        </div>
      )}
    </Page>
  )
}

AdminHelpArticlesEdit.layout = [AdminLayout]
