import { type BadgeTone } from '~/lib/styles'
import { type SupportTicketStatus } from './_types'

export const supportStatusMeta: Record<SupportTicketStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Needs reply', tone: 'warning' },
  pending_customer: { label: 'Waiting on customer', tone: 'info' },
  closed: { label: 'Closed', tone: 'neutral' },
}
