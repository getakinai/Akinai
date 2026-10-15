import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { http } from '~/lib/http'
import { nextPageParam } from '~/lib/infinite_list'
import { toQueryString } from '~/lib/query_string'
import { transmitClient } from '~/lib/transmit'
import { useCan } from './_hooks'
import {
  AdminNotificationsResponseSchema,
  LiveAdminEventSchema,
  NotificationReadResponseSchema,
  NotificationsReadAllResponseSchema,
  NotificationsSeenResponseSchema,
  type AdminNotificationsPage,
  type LiveAdminEvent,
  type NotificationFilter,
} from './_notification_types'

const PAGE_SIZE = 15

export const notificationKeys = {
  all: ['admin', 'notifications'] as const,
  list: (filter: NotificationFilter) => [...notificationKeys.all, 'list', filter] as const,
}

/** Queries a new event can change: open order pages, lists and the events log. */
const LIVE_INVALIDATE = [
  notificationKeys.all,
  ['admin', 'events'],
  ['admin', 'orders'],
  ['admin', 'returns'],
  ['admin', 'dashboard'],
] as const

const LIVE_SUPPORT_INVALIDATE = [
  notificationKeys.all,
  ['admin', 'events'],
  ['admin', 'support'],
] as const

type NotificationsData = InfiniteData<AdminNotificationsPage>

export async function fetchAdminNotifications(filter: NotificationFilter, page: number) {
  return http(`/admin/notifications/list${toQueryString({ filter, page, perPage: PAGE_SIZE })}`, {
    schema: AdminNotificationsResponseSchema,
  })
}

/** The bell's notifications, 15 at a time; page 1 also carries the badge count. */
export function useAdminNotifications(filter: NotificationFilter, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: ({ pageParam }) => fetchAdminNotifications(filter, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  })
}

/** Applies `update` to every loaded notification in every cached list. */
function useUpdateCachedNotifications() {
  const queryClient = useQueryClient()
  return (update: (page: AdminNotificationsPage) => AdminNotificationsPage) =>
    queryClient.setQueriesData<NotificationsData>({ queryKey: notificationKeys.all }, (data) =>
      data ? { ...data, pages: data.pages.map(update) } : data
    )
}

/** Opening the panel: clears the badge. */
export function useMarkNotificationsSeen() {
  const queryClient = useQueryClient()
  const updateCached = useUpdateCachedNotifications()
  return useMutation({
    mutationFn: () =>
      http('/admin/notifications/seen', {
        method: 'PUT',
        body: {},
        schema: NotificationsSeenResponseSchema,
      }),
    onSuccess: ({ data }) =>
      updateCached((page) => ({
        ...page,
        metadata: { ...page.metadata, badge: 0, seenAt: data.seenAt },
      })),
    onError: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const updateCached = useUpdateCachedNotifications()
  return useMutation({
    mutationFn: (id: string) =>
      http(`/admin/notifications/${id}/read`, {
        method: 'PUT',
        body: {},
        schema: NotificationReadResponseSchema,
      }),
    onMutate: (id) =>
      updateCached((page) => ({
        ...page,
        data: page.data.map((item) => (item.id === id ? { ...item, read: true } : item)),
      })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const updateCached = useUpdateCachedNotifications()
  return useMutation({
    mutationFn: () =>
      http('/admin/notifications/read-all', {
        method: 'PUT',
        body: {},
        schema: NotificationsReadAllResponseSchema,
      }),
    onMutate: () =>
      updateCached((page) => ({
        ...page,
        data: page.data.map((item) => ({ ...item, read: true })),
      })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function actorName(event: Pick<LiveAdminEvent, 'actorType' | 'actorLabel'>) {
  if (event.actorLabel) return event.actorLabel
  return event.actorType === 'system' ? 'The store' : 'Someone'
}

function notificationTarget(
  event: Pick<LiveAdminEvent, 'orderId' | 'subjectType' | 'subjectId'>
): string | null {
  if (event.subjectType === 'SupportTicket') return `/admin/support/tickets/show/${event.subjectId}`
  if (event.orderId) return `/admin/orders/show/${event.orderId}`
  return null
}

export function openNotificationTarget(
  event: Pick<LiveAdminEvent, 'orderId' | 'subjectType' | 'subjectId'>
) {
  const target = notificationTarget(event)
  if (target) router.visit(target)
}

/**
 * Listens on one live admin events channel (Server-Sent Events) while the
 * back office is open. Each event shows a toast and refreshes `invalidate`.
 */
function useLiveChannel(
  channel: 'admin/orders' | 'admin/support',
  enabled: boolean,
  invalidate: readonly (readonly string[])[]
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const transmit = enabled ? transmitClient() : null
    if (!transmit) return
    const subscription = transmit.subscription(channel)
    const stop = subscription.onMessage((message: unknown) => {
      const parsed = LiveAdminEventSchema.safeParse(message)
      if (!parsed.success) return
      const event = parsed.data
      toast(`${actorName(event)} ${event.title}`, {
        action: notificationTarget(event)
          ? { label: 'View', onClick: () => openNotificationTarget(event) }
          : undefined,
      })
      for (const queryKey of invalidate) {
        void queryClient.invalidateQueries({ queryKey })
      }
    })
    void subscription.create().catch((error: unknown) => {
      console.warn('Live notifications are unavailable', error)
    })
    return () => {
      stop()
      void subscription.delete().catch((error: unknown) => {
        console.warn('Could not stop live notifications', error)
      })
    }
  }, [channel, enabled, invalidate, queryClient])
}

/** Live order and support events, for the channels the user may see. */
export function useAdminLiveEvents() {
  useLiveChannel('admin/orders', useCan('orders.view'), LIVE_INVALIDATE)
  useLiveChannel('admin/support', useCan('support_tickets.view'), LIVE_SUPPORT_INVALIDATE)
}

/** The bell shows for anyone who can see at least one kind of notification. */
export function useCanViewNotifications() {
  const canViewOrders = useCan('orders.view')
  const canViewSupport = useCan('support_tickets.view')
  return canViewOrders || canViewSupport
}
