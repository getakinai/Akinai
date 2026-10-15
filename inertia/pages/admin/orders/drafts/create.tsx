import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import DraftOrderForm from './_draft_order_form'

export default function AdminDraftOrdersCreate() {
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
      title="Create order"
      description="Build an order for a customer. Save it as a draft, then mark it paid or payment pending."
    >
      <DraftOrderForm />
    </Page>
  )
}

AdminDraftOrdersCreate.layout = [AdminLayout]
