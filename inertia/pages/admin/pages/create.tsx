import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import PageForm from './_page_form'

export default function AdminPagesCreate() {
  return (
    <Page
      eyebrow={
        <Link route="admin.pages.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Pages
        </Link>
      }
      title="Create page"
      description="Publish a content page, or set it as one of your store policies."
    >
      <PageForm />
    </Page>
  )
}

AdminPagesCreate.layout = [AdminLayout]
