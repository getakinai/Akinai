import { Checkbox } from '~/components/ui'
import { cn } from '~/lib/styles'
import { type PermissionResource, type AdminRole } from './_types'

type PermissionMatrixCardProps = {
  resource: PermissionResource
  actions: string[]
  roles: AdminRole[]
  canEdit: boolean
  pending: Set<string>
  onToggle: (role: AdminRole, permission: string, granted: boolean) => void
}

export function cellKey(roleId: string, permission: string) {
  return `${roleId}:${permission}`
}

const th =
  'h-10 border-b border-line px-5 text-left align-middle font-mono text-[10.5px] font-medium tracking-[0.12em] whitespace-nowrap text-subtle uppercase'
const td = 'h-[52px] border-b border-line px-5 align-middle text-[13.5px] text-ink-2'

export default function PermissionMatrixCard({
  resource,
  actions,
  roles,
  canEdit,
  pending,
  onToggle,
}: PermissionMatrixCardProps) {
  return (
    <section
      className="overflow-hidden rounded-card border border-line-2 bg-card"
      aria-labelledby={`resource-${resource.key}`}
    >
      <header className="px-5 pt-4 pb-3">
        <h3 id={`resource-${resource.key}`} className="text-[14.5px] font-semibold text-ink">
          {resource.label}
        </h3>
        <p className="mt-0.5 text-[13px] text-muted">{resource.description}</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse">
          <thead>
            <tr>
              <th scope="col" className={cn(th, 'w-[22%]')}>
                Role
              </th>
              {actions.map((action) => (
                <th key={action} scope="col" className={th}>
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>*]:border-b-0">
            {roles.map((role) => (
              <tr key={role.id} className="transition-colors duration-150 hover:bg-paper/60">
                <th scope="row" className={cn(td, 'font-medium text-ink')}>
                  {role.name}
                </th>
                {actions.map((action) => {
                  if (!resource.actions.includes(action)) {
                    return (
                      <td key={action} className={cn(td, 'text-subtle')}>
                        <span aria-label="Not applicable">—</span>
                      </td>
                    )
                  }

                  const permission = `${resource.key}.${action}`
                  const checked = role.permissions.includes(permission)

                  return (
                    <td key={action} className={td}>
                      <Checkbox
                        aria-label={`${role.name}: ${action} ${resource.label}`}
                        checked={checked}
                        disabled={!canEdit || pending.has(cellKey(role.id, permission))}
                        onChange={(event) => onToggle(role, permission, event.target.checked)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
