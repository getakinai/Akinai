import { useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { card } from '~/lib/styles'
import { draftLabel } from '../_format'
import { useAdminDraftOrder } from '../_hooks'
import DraftOrderForm from './_draft_order_form'

export default function AdminDraftOrdersEdit({ id }: { id: string }) {
  const { formatOrderDate } = useDateFormat()
  const { data: draft, isLoading, isError, refetch } = useAdminDraftOrder(id)
  const completed = draft !== undefined && draft.status !== 'draft'

  useEffect(() => {
    if (completed) router.visit(`/admin/orders/show/${id}`)
  }, [completed, id])

  return (
    <Page
      eyebrow={
        <Link
          route="admin.orders.drafts.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Drafts
        </Link>
      }
      title={draft ? `Draft ${draftLabel(draft.draftNumber)}` : 'Draft order'}
      description={draft ? `Created ${formatOrderDate(draft.createdAt)}` : undefined}
      actions={draft && <Badge tone="neutral">Draft</Badge>}
    >
      {isLoading || completed ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : isError || !draft ? (
        <div
          className={`${card.base} flex flex-col items-center gap-3 py-12 text-center text-[14px] text-muted`}
        >
          Could not load this draft.
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : (
        <DraftOrderForm key={draft.id} draft={draft} />
      )}
    </Page>
  )
}

AdminDraftOrdersEdit.layout = [AdminLayout]
