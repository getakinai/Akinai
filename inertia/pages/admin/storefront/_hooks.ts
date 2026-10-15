import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storefrontKeys } from '~/pages/_hooks'
import type { PromoPlacement } from '~/lib/storefront'
import {
  AdminCollectionOptionsResponseSchema,
  AdminPageOptionsResponseSchema,
  AdminFeaturedReviewListResponseSchema,
  AdminStorefrontFeatureListResponseSchema,
  AdminStorefrontMenuItemResponseSchema,
  AdminStorefrontMenuListResponseSchema,
  AdminStorefrontPromoBannerListResponseSchema,
  AdminStorefrontPromoBannerResponseSchema,
  AdminStorefrontThemeResponseSchema,
  EmptyResponseSchema,
  type AdminStorefrontBrandForm,
  type AdminStorefrontContentForm,
  type AdminStorefrontFeaturesForm,
  type AdminStorefrontPromoBanner,
  type AdminStorefrontPromoBannerForm,
  type AdminStorefrontTheme,
  type AdminStorefrontMenuItem,
  type AdminStorefrontMenuItemForm,
  type AdminStorefrontThemeForm,
} from './_types'

export const adminStorefrontKeys = {
  all: ['admin', 'storefront'] as const,
  theme: ['admin', 'storefront', 'theme'] as const,
  menu: ['admin', 'storefront', 'menu'] as const,
  collections: ['admin', 'storefront', 'menu', 'collections'] as const,
  pages: ['admin', 'storefront', 'menu', 'pages'] as const,
  promoBanners: ['admin', 'storefront', 'promo-banners'] as const,
  features: ['admin', 'storefront', 'features'] as const,
  featuredReviews: ['admin', 'storefront', 'featured-reviews'] as const,
}

export async function fetchAdminStorefrontTheme() {
  const { data } = await http('/admin/storefront/theme/view', {
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

export function useAdminStorefrontTheme() {
  return useQuery({ queryKey: adminStorefrontKeys.theme, queryFn: fetchAdminStorefrontTheme })
}

export async function updateAdminStorefrontTheme(payload: AdminStorefrontThemeForm) {
  const { data } = await http('/admin/storefront/theme', {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

function useSaveTheme() {
  const queryClient = useQueryClient()
  return (saved: AdminStorefrontTheme) => {
    queryClient.setQueryData(adminStorefrontKeys.theme, saved)
    queryClient.invalidateQueries({ queryKey: storefrontKeys.theme })
  }
}

export function useUpdateAdminStorefrontTheme() {
  const onSuccess = useSaveTheme()
  return useMutation({ mutationFn: updateAdminStorefrontTheme, onSuccess })
}

export async function updateAdminStorefrontBrand(payload: AdminStorefrontBrandForm) {
  const { data } = await http('/admin/storefront/theme/brand', {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

export function useUpdateAdminStorefrontBrand() {
  const onSuccess = useSaveTheme()
  return useMutation({ mutationFn: updateAdminStorefrontBrand, onSuccess })
}

export type BrandingAsset = 'logo' | 'favicon'

export async function uploadAdminStorefrontBranding({
  asset,
  file,
}: {
  asset: BrandingAsset
  file: File
}) {
  const body = new FormData()
  body.append(asset, file)
  const { data } = await http(`/admin/storefront/theme/${asset}`, {
    method: 'POST',
    body,
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

export function useUploadAdminStorefrontBranding() {
  const onSuccess = useSaveTheme()
  return useMutation({ mutationFn: uploadAdminStorefrontBranding, onSuccess })
}

export async function removeAdminStorefrontBranding(asset: BrandingAsset) {
  const { data } = await http(`/admin/storefront/theme/${asset}`, {
    method: 'DELETE',
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

export function useRemoveAdminStorefrontBranding() {
  const onSuccess = useSaveTheme()
  return useMutation({ mutationFn: removeAdminStorefrontBranding, onSuccess })
}

export async function fetchAdminStorefrontMenu() {
  const { data } = await http('/admin/storefront/menu/list', {
    schema: AdminStorefrontMenuListResponseSchema,
  })
  return data
}

export function useAdminStorefrontMenu() {
  return useQuery({ queryKey: adminStorefrontKeys.menu, queryFn: fetchAdminStorefrontMenu })
}

export async function fetchAdminStorefrontCollectionOptions() {
  const { data } = await http('/admin/storefront/menu/collections', {
    schema: AdminCollectionOptionsResponseSchema,
  })
  return data
}

export function useAdminStorefrontCollectionOptions(enabled = true) {
  return useQuery({
    queryKey: adminStorefrontKeys.collections,
    queryFn: fetchAdminStorefrontCollectionOptions,
    enabled,
  })
}

export async function fetchAdminStorefrontPageOptions() {
  const { data } = await http('/admin/storefront/menu/pages', {
    schema: AdminPageOptionsResponseSchema,
  })
  return data
}

export function useAdminStorefrontPageOptions(enabled = true) {
  return useQuery({
    queryKey: adminStorefrontKeys.pages,
    queryFn: fetchAdminStorefrontPageOptions,
    enabled,
  })
}

function useInvalidateMenu() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminStorefrontKeys.menu, exact: true }),
      queryClient.invalidateQueries({ queryKey: storefrontKeys.all }),
    ])
}

export async function createAdminStorefrontMenuItem(payload: AdminStorefrontMenuItemForm) {
  const { data } = await http('/admin/storefront/menu', {
    method: 'POST',
    body: payload,
    schema: AdminStorefrontMenuItemResponseSchema,
  })
  return data
}

export function useCreateAdminStorefrontMenuItem() {
  const invalidate = useInvalidateMenu()
  return useMutation({ mutationFn: createAdminStorefrontMenuItem, onSuccess: invalidate })
}

export async function updateAdminStorefrontMenuItem({
  id,
  ...payload
}: AdminStorefrontMenuItemForm & { id: string }) {
  const { data } = await http(`/admin/storefront/menu/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontMenuItemResponseSchema,
  })
  return data
}

/**
 * Applies the change to the cached menu right away (used by the visibility
 * toggle) and rolls it back if the request fails.
 */
export function useUpdateAdminStorefrontMenuItem() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateMenu()
  const key = adminStorefrontKeys.menu

  return useMutation({
    mutationFn: updateAdminStorefrontMenuItem,
    onMutate: async ({ id, label, isVisible }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontMenuItem[]>(key)
      if (previous) {
        queryClient.setQueryData(
          key,
          previous.map((item) => (item.id === id ? { ...item, label, isVisible } : item))
        )
      }
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })
}

export async function deleteAdminStorefrontMenuItem(id: string) {
  await http(`/admin/storefront/menu/${id}`, { method: 'DELETE', schema: EmptyResponseSchema })
}

export function useDeleteAdminStorefrontMenuItem() {
  const invalidate = useInvalidateMenu()
  return useMutation({ mutationFn: deleteAdminStorefrontMenuItem, onSuccess: invalidate })
}

export async function reorderAdminStorefrontMenu(ids: string[]) {
  await http('/admin/storefront/menu/reorder', {
    method: 'PUT',
    body: { ids },
    schema: EmptyResponseSchema,
  })
}

/**
 * Reorders the cached menu right away and rolls back if the request fails.
 */
export function useReorderAdminStorefrontMenu() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateMenu()
  const key = adminStorefrontKeys.menu

  return useMutation({
    mutationFn: reorderAdminStorefrontMenu,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontMenuItem[]>(key)
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]))
        queryClient.setQueryData(
          key,
          ids.flatMap((id, position) => {
            const item = byId.get(id)
            return item ? [{ ...item, position }] : []
          })
        )
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })
}

export async function updateAdminStorefrontContent(payload: AdminStorefrontContentForm) {
  const { data } = await http('/admin/storefront/content', {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontThemeResponseSchema,
  })
  return data
}

export function useUpdateAdminStorefrontContent() {
  const onSuccess = useSaveTheme()
  return useMutation({ mutationFn: updateAdminStorefrontContent, onSuccess })
}

export async function fetchAdminStorefrontPromoBanners() {
  const { data } = await http('/admin/storefront/promo-banners/list', {
    schema: AdminStorefrontPromoBannerListResponseSchema,
  })
  return data
}

export function useAdminStorefrontPromoBanners() {
  return useQuery({
    queryKey: adminStorefrontKeys.promoBanners,
    queryFn: fetchAdminStorefrontPromoBanners,
  })
}

function useInvalidatePromoBanners() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminStorefrontKeys.promoBanners, exact: true }),
      queryClient.invalidateQueries({ queryKey: storefrontKeys.homeContent }),
    ])
}

export async function createAdminStorefrontPromoBanner(
  payload: AdminStorefrontPromoBannerForm & { placement: PromoPlacement }
) {
  const { data } = await http('/admin/storefront/promo-banners', {
    method: 'POST',
    body: payload,
    schema: AdminStorefrontPromoBannerResponseSchema,
  })
  return data
}

export function useCreateAdminStorefrontPromoBanner() {
  const invalidate = useInvalidatePromoBanners()
  return useMutation({ mutationFn: createAdminStorefrontPromoBanner, onSuccess: invalidate })
}

export async function updateAdminStorefrontPromoBanner({
  id,
  ...payload
}: AdminStorefrontPromoBannerForm & { id: string }) {
  const { data } = await http(`/admin/storefront/promo-banners/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontPromoBannerResponseSchema,
  })
  return data
}

/**
 * Applies the change to the cached banners right away (used by the
 * visibility toggle) and rolls it back if the request fails.
 */
export function useUpdateAdminStorefrontPromoBanner() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidatePromoBanners()
  const key = adminStorefrontKeys.promoBanners

  return useMutation({
    mutationFn: updateAdminStorefrontPromoBanner,
    onMutate: async ({ id, title, isVisible }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontPromoBanner[]>(key)
      if (previous) {
        queryClient.setQueryData(
          key,
          previous.map((banner) => (banner.id === id ? { ...banner, title, isVisible } : banner))
        )
      }
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })
}

export async function deleteAdminStorefrontPromoBanner(id: string) {
  await http(`/admin/storefront/promo-banners/${id}`, {
    method: 'DELETE',
    schema: EmptyResponseSchema,
  })
}

export function useDeleteAdminStorefrontPromoBanner() {
  const invalidate = useInvalidatePromoBanners()
  return useMutation({ mutationFn: deleteAdminStorefrontPromoBanner, onSuccess: invalidate })
}

export async function reorderAdminStorefrontPromoBanners({
  placement,
  ids,
}: {
  placement: PromoPlacement
  ids: string[]
}) {
  await http('/admin/storefront/promo-banners/reorder', {
    method: 'PUT',
    body: { placement, ids },
    schema: EmptyResponseSchema,
  })
}

/**
 * Reorders one placement in the cache right away and rolls back if the
 * request fails. Banners in the other placement keep their order.
 */
export function useReorderAdminStorefrontPromoBanners() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidatePromoBanners()
  const key = adminStorefrontKeys.promoBanners

  return useMutation({
    mutationFn: reorderAdminStorefrontPromoBanners,
    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontPromoBanner[]>(key)
      if (previous) {
        const positions = new Map(ids.map((id, position) => [id, position]))
        queryClient.setQueryData(
          key,
          previous
            .map((banner) => {
              const position = positions.get(banner.id)
              return position === undefined ? banner : { ...banner, position }
            })
            .sort((a, b) => a.position - b.position)
        )
      }
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })
}

export async function uploadAdminStorefrontPromoBannerImage({
  id,
  file,
}: {
  id: string
  file: File
}) {
  const body = new FormData()
  body.append('image', file)
  const { data } = await http(`/admin/storefront/promo-banners/${id}/image`, {
    method: 'POST',
    body,
    schema: AdminStorefrontPromoBannerResponseSchema,
  })
  return data
}

export function useUploadAdminStorefrontPromoBannerImage() {
  const invalidate = useInvalidatePromoBanners()
  return useMutation({ mutationFn: uploadAdminStorefrontPromoBannerImage, onSuccess: invalidate })
}

export async function removeAdminStorefrontPromoBannerImage(id: string) {
  const { data } = await http(`/admin/storefront/promo-banners/${id}/image`, {
    method: 'DELETE',
    schema: AdminStorefrontPromoBannerResponseSchema,
  })
  return data
}

export function useRemoveAdminStorefrontPromoBannerImage() {
  const invalidate = useInvalidatePromoBanners()
  return useMutation({ mutationFn: removeAdminStorefrontPromoBannerImage, onSuccess: invalidate })
}

export async function fetchAdminStorefrontFeatures() {
  const { data } = await http('/admin/storefront/features/list', {
    schema: AdminStorefrontFeatureListResponseSchema,
  })
  return data
}

export function useAdminStorefrontFeatures() {
  return useQuery({ queryKey: adminStorefrontKeys.features, queryFn: fetchAdminStorefrontFeatures })
}

export async function replaceAdminStorefrontFeatures(payload: AdminStorefrontFeaturesForm) {
  const { data } = await http('/admin/storefront/features', {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontFeatureListResponseSchema,
  })
  return data
}

export function useReplaceAdminStorefrontFeatures() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: replaceAdminStorefrontFeatures,
    onSuccess: (saved) => {
      queryClient.setQueryData(adminStorefrontKeys.features, saved)
      return queryClient.invalidateQueries({ queryKey: storefrontKeys.homeContent })
    },
  })
}

export async function fetchAdminFeaturedReviews() {
  const { data } = await http('/admin/storefront/featured-reviews/list', {
    schema: AdminFeaturedReviewListResponseSchema,
  })
  return data
}

export function useAdminFeaturedReviews() {
  return useQuery({
    queryKey: adminStorefrontKeys.featuredReviews,
    queryFn: fetchAdminFeaturedReviews,
  })
}
