import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { adminKeys } from '../_hooks'
import {
  RoleMatrixResponseSchema,
  RolePermissionToggleSchema,
  AdminRoleDeleteResponseSchema,
  AdminRoleResponseSchema,
  type RoleMatrix,
  type RolePermissionToggle,
  type AdminRoleForm,
} from './_types'

export const adminRolesKeys = {
  all: ['admin', 'roles'] as const,
  matrix: ['admin', 'roles', 'matrix'] as const,
}

export async function fetchRoleMatrix() {
  const { data } = await http('/admin/roles/matrix', { schema: RoleMatrixResponseSchema })
  return data
}

export function useRoleMatrix() {
  return useQuery({ queryKey: adminRolesKeys.matrix, queryFn: fetchRoleMatrix })
}

export async function toggleRolePermission(payload: RolePermissionToggle) {
  const { roleId, permission, granted } = RolePermissionToggleSchema.parse(payload)
  const { data } = await http(`/admin/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: { permission, granted },
    schema: AdminRoleResponseSchema,
  })
  return data
}

function applyToggle(matrix: RoleMatrix, { roleId, permission, granted }: RolePermissionToggle) {
  return {
    ...matrix,
    roles: matrix.roles.map((role) => {
      if (role.id !== roleId) return role
      const permissions = granted
        ? [...new Set([...role.permissions, permission])]
        : role.permissions.filter((key) => key !== permission)
      return { ...role, permissions }
    }),
  }
}

/**
 * Optimistically flips the checkbox, rolls back on error and refetches the
 * matrix and the signed-in User's permissions once settled.
 */
export function useToggleRolePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleRolePermission,
    onMutate: async (toggle) => {
      await queryClient.cancelQueries({ queryKey: adminRolesKeys.matrix })
      const previous = queryClient.getQueryData<RoleMatrix>(adminRolesKeys.matrix)
      if (previous) {
        queryClient.setQueryData(adminRolesKeys.matrix, applyToggle(previous, toggle))
      }
      return { previous }
    },
    onError: (_error, _toggle, context) => {
      if (context?.previous) queryClient.setQueryData(adminRolesKeys.matrix, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.matrix })
      queryClient.invalidateQueries({ queryKey: adminKeys.me })
    },
  })
}

export async function createAdminRole(payload: AdminRoleForm) {
  const { data } = await http('/admin/roles', {
    method: 'POST',
    body: payload,
    schema: AdminRoleResponseSchema,
  })
  return data
}

export function useCreateAdminRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRolesKeys.all }),
  })
}

export async function updateAdminRole({ id, ...payload }: AdminRoleForm & { id: string }) {
  const { data } = await http(`/admin/roles/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminRoleResponseSchema,
  })
  return data
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.all })
      queryClient.invalidateQueries({ queryKey: adminKeys.me })
    },
  })
}

export async function deleteAdminRole(id: string) {
  await http(`/admin/roles/${id}`, { method: 'DELETE', schema: AdminRoleDeleteResponseSchema })
}

export function useDeleteAdminRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRolesKeys.all }),
  })
}
