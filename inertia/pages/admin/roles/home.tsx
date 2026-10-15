import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useRoleMatrix, useToggleRolePermission } from './_hooks'
import DeleteRoleDialog from './_delete_role_dialog'
import PermissionMatrixCard, { cellKey } from './_permission_matrix_card'
import RoleDialog from './_role_dialog'
import RolesCard from './_roles_card'
import { type AdminRole } from './_types'

type RoleDialogState = { open: false } | { open: true; role: AdminRole | null }

function MatrixSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading permissions">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={`${card.base} flex flex-col gap-3`}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="w-64" />
          <Skeleton className="mt-3 h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function AdminRolesHome() {
  const { data, isLoading, isError, refetch } = useRoleMatrix()
  const toggle = useToggleRolePermission()
  const [pending, setPending] = useState<Set<string>>(() => new Set())
  const [roleDialog, setRoleDialog] = useState<RoleDialogState>({ open: false })
  const [deleting, setDeleting] = useState<AdminRole | null>(null)

  const canCreate = useCan('roles.create')
  const canEdit = useCan('roles.edit')
  const canDelete = useCan('roles.archive')

  const editableRoles = data?.roles.filter((role) => !role.isLocked) ?? []
  const lockedRoles = data?.roles.filter((role) => role.isLocked) ?? []

  async function onToggle(role: AdminRole, permission: string, granted: boolean) {
    const key = cellKey(role.id, permission)
    setPending((current) => new Set(current).add(key))
    try {
      await toggle.mutateAsync({ roleId: role.id, permission, granted })
    } catch (error) {
      toast.error(error instanceof HttpError ? error.message : 'Could not update permission')
    } finally {
      setPending((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Management"
      title="Team & Permissions"
      description="Control access levels and assign roles to your staff."
    >
      {isLoading ? (
        <MatrixSkeleton />
      ) : isError || !data ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load roles and permissions.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <RolesCard
            roles={data.roles}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            onCreate={() => setRoleDialog({ open: true, role: null })}
            onEdit={(role) => setRoleDialog({ open: true, role })}
            onDelete={setDeleting}
          />

          {lockedRoles.length > 0 && (
            <p className="-mb-3 flex items-center gap-2 text-[13px] text-muted">
              <ShieldCheck size={15} className="text-accent" />
              {lockedRoles.map((role) => role.name).join(', ')} always{' '}
              {lockedRoles.length === 1 ? 'has' : 'have'} full access and{' '}
              {lockedRoles.length === 1 ? 'is' : 'are'} not listed below.
            </p>
          )}

          {data.sections.map((section) => (
            <section key={section.key} className="flex flex-col gap-3">
              <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">
                {section.label}
              </h2>
              {editableRoles.length === 0 ? (
                <p className={`${card.base} text-center text-[14px] text-muted`}>
                  Add a role to start granting permissions.
                </p>
              ) : (
                section.resources.map((resource) => (
                  <PermissionMatrixCard
                    key={resource.key}
                    resource={resource}
                    actions={data.actions}
                    roles={editableRoles}
                    canEdit={canEdit}
                    pending={pending}
                    onToggle={onToggle}
                  />
                ))
              )}
            </section>
          ))}
        </div>
      )}

      {roleDialog.open && (
        <RoleDialog
          key={roleDialog.role?.id ?? 'new'}
          open
          role={roleDialog.role}
          onClose={() => setRoleDialog({ open: false })}
        />
      )}
      <DeleteRoleDialog role={deleting} onClose={() => setDeleting(null)} />
    </Page>
  )
}

AdminRolesHome.layout = [AdminLayout]
