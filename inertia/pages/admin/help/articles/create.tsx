import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import ArticleForm from './_article_form'

export default function AdminHelpArticlesCreate() {
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
      title="Add help article"
      description="Write a guide for the storefront help center and the help chat."
    >
      <ArticleForm />
    </Page>
  )
}

AdminHelpArticlesCreate.layout = [AdminLayout]
