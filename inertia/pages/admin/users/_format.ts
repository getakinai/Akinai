import { type BadgeTone } from '~/lib/styles'
import { type AdminUserRole, type AdminUserStatus } from '../_types'

export const userStatusMeta: Record<AdminUserStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  inactive: { label: 'Inactive', tone: 'neutral' },
}

export const userStatusOptions = Object.entries(userStatusMeta).map(([value, { label }]) => ({
  value,
  label,
}))

export function roleTone(role: Pick<AdminUserRole, 'isLocked'>): BadgeTone {
  return role.isLocked ? 'primary' : 'info'
}

export function userDisplayName(user: { fullName: string | null; email: string }) {
  return user.fullName || user.email
}
