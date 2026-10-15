import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { Permission } from '#abilities/permissions'
import type { AdminEventStatus, AdminEventType } from '#constants/admin_events'
import AdminEvent from '#models/admin_event'
import User from '#models/user'
import { containsPattern } from '#repositories/helpers/like'

export type CreateAdminEventData = Pick<
  AdminEvent,
  | 'type'
  | 'channel'
  | 'permission'
  | 'title'
  | 'details'
  | 'subjectType'
  | 'subjectId'
  | 'subjectLabel'
  | 'orderId'
  | 'actorType'
  | 'actorUserId'
  | 'actorCustomerId'
  | 'actorLabel'
>

export type PaginateAdminEventsData = {
  q?: string
  type?: AdminEventType
  status?: AdminEventStatus
  direction?: 'asc' | 'desc'
  page: number
  perPage: number
}

export type NotificationFilter = 'all' | 'unread'

export type NotificationsQuery = {
  userId: string
  permissions: Permission[]
  filter: NotificationFilter
  page: number
  perPage: number
}

/** Notifications older than this never count towards the badge. */
const BADGE_HORIZON_DAYS = 30

export default class AdminEventRepository {
  async create(data: CreateAdminEventData): Promise<AdminEvent> {
    return AdminEvent.create({
      ...data,
      status: 'pending',
      attempts: 0,
      lastError: null,
      deliveredAt: null,
    })
  }

  /** Display name of a staff user or customer, for the event snapshot. */
  async actorName(actor: { userId: string | null; customerId: string | null }) {
    const table = actor.userId ? 'users' : actor.customerId ? 'customers' : null
    if (!table) return null
    const row = await db
      .from(table)
      .where('id', actor.userId ?? actor.customerId!)
      .select('full_name', 'email')
      .first()
    if (!row) return null
    return (row.full_name as string | null) || (row.email as string)
  }

  async findOrFail(id: string): Promise<AdminEvent> {
    return AdminEvent.findOrFail(id)
  }

  async markDelivered(id: string): Promise<void> {
    await AdminEvent.query()
      .where('id', id)
      .update({
        status: 'delivered',
        attempts: db.raw('attempts + 1'),
        last_error: null,
        delivered_at: DateTime.now().toSQL(),
        updated_at: DateTime.now().toSQL(),
      })
  }

  async markFailed(id: string, error: string): Promise<void> {
    await AdminEvent.query()
      .where('id', id)
      .update({
        status: 'failed',
        attempts: db.raw('attempts + 1'),
        last_error: error.slice(0, 500),
        updated_at: DateTime.now().toSQL(),
      })
  }

  /** Oldest failed events first, so a retry batch catches up in order. */
  async failed(limit: number): Promise<AdminEvent[]> {
    return AdminEvent.query().where('status', 'failed').orderBy('created_at', 'asc').limit(limit)
  }

  async paginate({ q, type, status, direction, page, perPage }: PaginateAdminEventsData) {
    const order = direction ?? 'desc'
    const query = AdminEvent.query().orderBy('created_at', order).orderBy('id', order)
    if (type) query.where('type', type)
    if (status) query.where('status', status)
    if (q) {
      const pattern = containsPattern(q)
      query.where((inner) => {
        inner
          .whereILike('title', pattern)
          .orWhereILike('subject_label', pattern)
          .orWhereILike('actor_label', pattern)
      })
    }
    return query.paginate(page, perPage)
  }

  /**
   * The user's notifications, newest first, with `$extras.read`. Only
   * events their permissions cover.
   */
  async notifications({ userId, permissions, filter, page, perPage }: NotificationsQuery) {
    const query = AdminEvent.query()
      .select('admin_events.*')
      .select(db.raw('(r.id is not null) as read'))
      .leftJoin('admin_event_reads as r', (join) => {
        join.on('r.admin_event_id', 'admin_events.id').andOnVal('r.user_id', userId)
      })
      .whereIn('admin_events.permission', permissions)
      .orderBy('admin_events.created_at', 'desc')
      .orderBy('admin_events.id', 'desc')
    if (filter === 'unread') query.whereNull('r.id')
    return query.paginate(page, perPage)
  }

  /** Visible events created after the user last opened the panel. */
  async badgeCount(user: User, permissions: Permission[]): Promise<number> {
    const horizon = DateTime.now().minus({ days: BADGE_HORIZON_DAYS })
    const since =
      user.notificationsSeenAt && user.notificationsSeenAt > horizon
        ? user.notificationsSeenAt
        : horizon
    const row = await db
      .from('admin_events')
      .whereIn('permission', permissions)
      .where('created_at', '>', since.toSQL()!)
      .count('* as total')
      .first()
    return Number(row?.total ?? 0)
  }

  /** Query-builder update: opening the panel isn't an audited profile change. */
  async markSeen(userId: string): Promise<DateTime> {
    const now = DateTime.now()
    await User.query().where('id', userId).update({ notifications_seen_at: now.toSQL() })
    return now
  }

  /** False when the event doesn't exist or the user can't see it. */
  async markRead(userId: string, eventId: string, permissions: Permission[]): Promise<boolean> {
    const result = await db.rawQuery(
      `insert into admin_event_reads (id, user_id, admin_event_id, created_at, updated_at)
       select gen_random_uuid(), ?, e.id, now(), now()
       from admin_events e
       where e.id = ? and e.permission = any(?)
       on conflict (user_id, admin_event_id) do nothing
       returning id`,
      [userId, eventId, permissions]
    )
    if (result.rows.length > 0) return true
    const visible = await db
      .from('admin_events')
      .where('id', eventId)
      .whereIn('permission', permissions)
      .first()
    return Boolean(visible)
  }

  /** One statement for every unread event the user can see. */
  async markAllRead(userId: string, permissions: Permission[]): Promise<number> {
    const result = await db.rawQuery(
      `insert into admin_event_reads (id, user_id, admin_event_id, created_at, updated_at)
       select gen_random_uuid(), ?, e.id, now(), now()
       from admin_events e
       where e.permission = any(?)
         and not exists (
           select 1 from admin_event_reads r where r.admin_event_id = e.id and r.user_id = ?
         )
       on conflict (user_id, admin_event_id) do nothing`,
      [userId, permissions, userId]
    )
    return result.rowCount ?? 0
  }

  async pruneBefore(cutoff: DateTime): Promise<number> {
    const deleted = await AdminEvent.query().where('created_at', '<', cutoff.toSQL()!).delete()
    return Number(deleted[0] ?? 0)
  }
}
