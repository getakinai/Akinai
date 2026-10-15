import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  ActivityListQuerySchema,
  type ActivityFilters,
  type ActivityListQuery,
} from '../_audit_types'
import { adminKeys } from '../_hooks'
import {
  AdminRoleOptionsResponseSchema,
  AdminUserActivityResponseSchema,
  AdminUserResponseSchema,
  AdminUsersListQuerySchema,
  AdminUsersListResponseSchema,
  AdminUserStoreResponseSchema,
  type AdminUserCreateForm,
  type AdminUsersListQuery,
  type AdminUserUpdateForm,
} from './_types'

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  lists: ['admin', 'users', 'list'] as const,
  list: (query: AdminUsersListQuery) => [...adminUsersKeys.lists, query] as const,
  detail: (id: string) => [...adminUsersKeys.all, 'detail', id] as const,
  roles: ['admin', 'users', 'roles'] as const,
  activity: (id: string, filters: ActivityFilters) =>
    [...adminUsersKeys.all, 'activity', id, 'infinite', filters] as const,
}

export async function fetchAdminUsers(query: AdminUsersListQuery) {
  const params = AdminUsersListQuerySchema.parse(query)
  return http(`/admin/users/list${toQueryString(params)}`, {
    schema: AdminUsersListResponseSchema,
  })
}

export function useAdminUsers(query: AdminUsersListQuery) {
  return useQuery({
    queryKey: adminUsersKeys.list(query),
    queryFn: () => fetchAdminUsers(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminUsersInfinite(filters: Omit<AdminUsersListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminUsersKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminUsers({ ...filters, ...page })
  )
}

export async function fetchAdminUser(id: string) {
  const { data } = await http(`/admin/users/view/${id}`, { schema: AdminUserResponseSchema })
  return data
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminUsersKeys.detail(id),
    queryFn: () => fetchAdminUser(id),
  })
}

export async function fetchAdminUserActivity(id: string, query: ActivityListQuery) {
  const params = ActivityListQuerySchema.parse(query)
  return http(`/admin/users/${id}/activity${toQueryString(params)}`, {
    schema: AdminUserActivityResponseSchema,
  })
}

/** The user's activity, loaded in batches as the table scrolls. */
export function useAdminUserActivityInfinite(id: string, filters: ActivityFilters) {
  return useAdminInfiniteList(adminUsersKeys.activity(id, filters), (page) =>
    fetchAdminUserActivity(id, { ...filters, ...page })
  )
}

export async function fetchAdminRoleOptions() {
  const { data } = await http('/admin/users/roles', { schema: AdminRoleOptionsResponseSchema })
  return data
}

export function useAdminRoleOptions() {
  return useQuery({ queryKey: adminUsersKeys.roles, queryFn: fetchAdminRoleOptions })
}

export async function createAdminUser(payload: AdminUserCreateForm) {
  const { data } = await http('/admin/users', {
    method: 'POST',
    body: payload,
    schema: AdminUserStoreResponseSchema,
  })
  return data
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists }),
  })
}

export async function updateAdminUser({ id, ...payload }: AdminUserUpdateForm & { id: string }) {
  const { data } = await http(`/admin/users/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminUserResponseSchema,
  })
  return data
}

/**
 * Seeds the detail cache with the saved User, refetches every list, and
 * refreshes `/admin/me` in case the signed-in User edited their own profile.
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminUser,
    onSuccess: (user) => {
      queryClient.setQueryData(adminUsersKeys.detail(user.id), user)
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists })
      queryClient.invalidateQueries({ queryKey: [...adminUsersKeys.all, 'activity'] })
      queryClient.invalidateQueries({ queryKey: adminKeys.me })
    },
  })
}
