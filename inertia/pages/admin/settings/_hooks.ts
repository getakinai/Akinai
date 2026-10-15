import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storeSettingsKeys } from '~/pages/_hooks'
import {
  AdminMaintenanceResponseSchema,
  AdminStoreSettingsResponseSchema,
  type AdminMaintenance,
  type AdminStoreAddressForm,
  type AdminStoreBusinessForm,
  type AdminStoreCheckoutForm,
  type AdminStoreContactForm,
  type AdminStoreDefaultsForm,
  type AdminStoreNotificationsForm,
  type AdminStoreSettings,
} from './_types'

export const adminStoreSettingsKeys = {
  all: ['admin', 'store_settings'] as const,
}

export async function fetchAdminStoreSettings() {
  const { data } = await http('/admin/settings/view', { schema: AdminStoreSettingsResponseSchema })
  return data
}

export function useAdminStoreSettings() {
  return useQuery({ queryKey: adminStoreSettingsKeys.all, queryFn: fetchAdminStoreSettings })
}

type Section = 'business' | 'contact' | 'address' | 'defaults' | 'notifications' | 'checkout'

async function updateSection<T extends object>(section: Section, payload: T) {
  const { data } = await http(`/admin/settings/${section}`, {
    method: 'PUT',
    body: payload,
    schema: AdminStoreSettingsResponseSchema,
  })
  return data
}

/**
 * Applies the change to the cached settings right away and rolls it back
 * if the request fails.
 */
function useUpdateSection<T extends object>(section: Section) {
  const queryClient = useQueryClient()
  const key = adminStoreSettingsKeys.all

  return useMutation({
    mutationFn: (payload: T) => updateSection(section, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AdminStoreSettings>(key)
      if (previous) queryClient.setQueryData(key, { ...previous, ...payload })
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all }),
      ]),
  })
}

export const useUpdateAdminStoreBusiness = () =>
  useUpdateSection<AdminStoreBusinessForm>('business')

export const useUpdateAdminStoreContact = () => useUpdateSection<AdminStoreContactForm>('contact')

export const useUpdateAdminStoreAddress = () => useUpdateSection<AdminStoreAddressForm>('address')

export const useUpdateAdminStoreDefaults = () =>
  useUpdateSection<AdminStoreDefaultsForm>('defaults')

export const useUpdateAdminStoreNotifications = () =>
  useUpdateSection<AdminStoreNotificationsForm>('notifications')

export const useUpdateAdminStoreCheckout = () =>
  useUpdateSection<AdminStoreCheckoutForm>('checkout')

export const adminMaintenanceKeys = {
  all: ['admin', 'maintenance'] as const,
}

export async function fetchAdminMaintenance() {
  const { data } = await http('/admin/settings/maintenance/view', {
    schema: AdminMaintenanceResponseSchema,
  })
  return data
}

export function useAdminMaintenance() {
  return useQuery({ queryKey: adminMaintenanceKeys.all, queryFn: fetchAdminMaintenance })
}

export async function updateAdminMaintenance(payload: AdminMaintenance) {
  const { data } = await http('/admin/settings/maintenance', {
    method: 'PUT',
    body: payload,
    schema: AdminMaintenanceResponseSchema,
  })
  return data
}

export function useUpdateAdminMaintenance() {
  const queryClient = useQueryClient()
  const key = adminMaintenanceKeys.all

  return useMutation({
    mutationFn: updateAdminMaintenance,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AdminMaintenance>(key)
      queryClient.setQueryData(key, payload)
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
