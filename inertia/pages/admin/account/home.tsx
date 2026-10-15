import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import AppearanceCard from './_appearance_card'
import MfaCard from './_mfa_card'
import PasswordCard from './_password_card'
import ProfileCard from './_profile_card'

export default function AdminAccountHome() {
  return (
    <Page
      eyebrow={
        <Link
          route="admin.dashboard.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Dashboard
        </Link>
      }
      title="My account"
      description="Your profile and how you sign in to the back office."
    >
      <div className="flex max-w-[760px] flex-col gap-6">
        <ProfileCard />
        <MfaCard />
        <PasswordCard />
        <AppearanceCard />
      </div>
    </Page>
  )
}

AdminAccountHome.layout = [AdminLayout]
