import type SupportTicket from '#models/support_ticket'
import type SupportTicketMessage from '#models/support_ticket_message'
import { BaseTransformer } from '@adonisjs/core/transformers'

export type SupportTicketThread = {
  ticket: SupportTicket
  messages: SupportTicketMessage[]
}

function person(record: { id: string; fullName: string | null; email: string } | null) {
  return record ? { id: record.id, name: record.fullName || record.email } : null
}

function staffFirstName(message: SupportTicketMessage) {
  return message.user?.fullName?.trim().split(/\s+/)[0] || null
}

function adminMessage(message: SupportTicketMessage, ticket: SupportTicket) {
  return {
    id: message.id,
    authorType: message.authorType,
    authorName:
      message.authorType === 'staff'
        ? message.user?.fullName || message.user?.email || 'Former team member'
        : ticket.fullName,
    isInternal: message.isInternal,
    body: message.body,
    createdAt: message.createdAt.toISO(),
  }
}

/** Customer-facing message: no staff ids or emails, and internal notes are never loaded. */
function customerMessage(message: SupportTicketMessage) {
  return {
    id: message.id,
    fromCustomer: message.authorType === 'customer',
    staffName: message.authorType === 'staff' ? staffFirstName(message) : null,
    body: message.body,
    createdAt: message.createdAt.toISO(),
  }
}

function customerSummary(ticket: SupportTicket) {
  return {
    reference: ticket.reference,
    status: ticket.status,
    lastMessageAt: ticket.lastMessageAt.toISO(),
    createdAt: ticket.createdAt.toISO(),
  }
}

function adminRow(ticket: SupportTicket) {
  return {
    id: ticket.id,
    reference: ticket.reference,
    fullName: ticket.fullName,
    email: ticket.email,
    mobile: ticket.mobile,
    status: ticket.status,
    customerId: ticket.customerId,
    assignedUser: person(ticket.assignedUser ?? null),
    lastMessageAt: ticket.lastMessageAt.toISO(),
    closedAt: ticket.closedAt?.toISO() ?? null,
    createdAt: ticket.createdAt.toISO(),
  }
}

/** Back-office inbox row. */
export default class SupportTicketTransformer extends BaseTransformer<SupportTicket> {
  toObject() {
    return adminRow(this.resource)
  }

  /** Signed-in customer's list row on `/account/support`. */
  toCustomer() {
    return { id: this.resource.id, ...customerSummary(this.resource) }
  }
}

export class SupportTicketThreadTransformer extends BaseTransformer<SupportTicketThread> {
  /** Staff view: contact details, chat transcript and internal notes. */
  toObject() {
    const { ticket, messages } = this.resource
    return {
      ticket: {
        ...adminRow(ticket),
        customer: person(ticket.customer ?? null),
        chatTranscript: ticket.chatTranscript ?? [],
      },
      messages: messages.map((message) => adminMessage(message, ticket)),
    }
  }

  /** Signed-in customer's thread on `/account/support/:id`. */
  toCustomer() {
    const { ticket, messages } = this.resource
    return {
      ticket: { id: ticket.id, ...customerSummary(ticket), fullName: ticket.fullName },
      messages: messages.map(customerMessage),
    }
  }

  /** Thread opened from the emailed link: no ids, the token is the only handle. */
  toPublic() {
    const { ticket, messages } = this.resource
    return {
      ticket: { ...customerSummary(ticket), fullName: ticket.fullName },
      messages: messages.map(customerMessage),
    }
  }
}
