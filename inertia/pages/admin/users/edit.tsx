import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Eye } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import { buttonClasses } from '~/lib/styles'
import { useAdminMe } from '../_hooks'
import { userDisplayName } from './_format'
import { useAdminRoleOptions, useAdminUser } from './_hooks'
import { UserLoadError, UserSkeleton } from './_page_states'
import ProfileForm from './_profile_form'

export default function AdminUsersEdit({ id }: { id: string }) {
  const { data: user, isLoading, isError, refetch } = useAdminUser(id)
  const roles = useAdminRoleOptions()
  const { data: me, isLoading: meLoading } = useAdminMe()

  return (
    <Page
      eyebrow={
        <Link route="admin.users.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Users
        </Link>
      }
      title={user ? `Edit ${userDisplayName(user)}` : 'Edit user'}
      description="Update the profile, role and status of this staff account."
      actions={
        user && (
          <Link
            route="admin.users.show"
            routeParams={{ id: user.id }}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            <Eye size={15} /> View
          </Link>
        )
      }
    >
      {isLoading || meLoading ? (
        <UserSkeleton />
      ) : isError || !user ? (
        <UserLoadError onRetry={() => refetch()} />
      ) : (
        <div className="max-w-2xl">
          <ProfileForm
            key={`${user.id}-${user.updatedAt ?? ''}`}
            user={user}
            me={me}
            roles={roles.data ?? []}
            rolesLoading={roles.isLoading}
          />
        </div>
      )}
    </Page>
  )
}

AdminUsersEdit.layout = [AdminLayout]
