import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import CollectionForm from './_collection_form'

export default function AdminCollectionsCreate() {
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
      title="Create collection"
      description="Automated collections fill themselves from your conditions. Manual collections are hand-picked."
    >
      <CollectionForm />
    </Page>
  )
}

AdminCollectionsCreate.layout = [AdminLayout]
