import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge, IconButton } from '~/components/ui'
import { card } from '~/lib/styles'
import { type AdminRole } from './_types'

type RolesCardProps = {
  roles: AdminRole[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onCreate: () => void
  onEdit: (role: AdminRole) => void
  onDelete: (role: AdminRole) => void
}

function deleteBlockedReason(role: AdminRole) {
  if (role.isLocked) return 'The admin role cannot be deleted'
  if (role.isDefault) return 'The default role cannot be deleted'
  if ((role.userCount ?? 0) > 0) return 'Move the users assigned to this role first'
  return null
}

export default function RolesCard({
  roles,
  canCreate,
  canEdit,
  canDelete,
  onCreate,
  onEdit,
  onDelete,
}: RolesCardProps) {
  return (
    <section className="overflow-hidden rounded-card border border-line-2 bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 max-[720px]:px-4">
        <div>
          <span className={card.eyebrow}>Roles</span>
          <h2 className="mt-0.5 text-[14.5px] font-semibold text-ink">
            {roles.length} {roles.length === 1 ? 'role' : 'roles'}
          </h2>
        </div>
        {canCreate && (
          <FormButton type="button" size="sm" onClick={onCreate}>
            <Plus size={15} /> Add role
          </FormButton>
        )}
      </header>

      <ul className="divide-y divide-line">
        {roles.map((role) => {
          const blocked = deleteBlockedReason(role)

          return (
            <li
              key={role.id}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4 max-[720px]:px-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-ink">{role.name}</span>
                  {role.isLocked && (
                    <Badge tone="primary">
                      <Lock size={11} /> Full access
                    </Badge>
                  )}
                  {role.isDefault && <Badge tone="info">Default</Badge>}
                </div>
                {role.description && (
                  <p className="mt-0.5 truncate text-[13px] text-muted">{role.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 sm:contents">
                <span className="font-mono text-[12px] whitespace-nowrap text-muted">
                  {role.userCount ?? 0} {role.userCount === 1 ? 'user' : 'users'}
                </span>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <IconButton
                        label={
                          role.isLocked ? 'The admin role cannot be changed' : `Edit ${role.name}`
                        }
                        size="sm"
                        disabled={role.isLocked}
                        onClick={() => onEdit(role)}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        label={blocked ?? `Delete ${role.name}`}
                        size="sm"
                        disabled={blocked !== null}
                        onClick={() => onDelete(role)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
