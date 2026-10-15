import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storefrontKeys } from '~/pages/_hooks'
import {
  AdminStorefrontHeroSlideListResponseSchema,
  AdminStorefrontHeroSlideResponseSchema,
  EmptyResponseSchema,
  type AdminStorefrontHeroSlide,
  type AdminStorefrontHeroSlideForm,
} from './_types'

export const adminHeroKeys = {
  all: ['admin', 'storefront', 'hero'] as const,
}

export async function fetchAdminStorefrontHeroSlides() {
  const { data } = await http('/admin/storefront/hero-slides/list', {
    schema: AdminStorefrontHeroSlideListResponseSchema,
  })
  return data
}

export function useAdminStorefrontHeroSlides() {
  return useQuery({ queryKey: adminHeroKeys.all, queryFn: fetchAdminStorefrontHeroSlides })
}

function useInvalidateHero() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminHeroKeys.all, exact: true }),
      queryClient.invalidateQueries({ queryKey: storefrontKeys.heroSlides }),
    ])
}

export async function createAdminStorefrontHeroSlide(payload: AdminStorefrontHeroSlideForm) {
  const { data } = await http('/admin/storefront/hero-slides', {
    method: 'POST',
    body: payload,
    schema: AdminStorefrontHeroSlideResponseSchema,
  })
  return data
}

export function useCreateAdminStorefrontHeroSlide() {
  const invalidate = useInvalidateHero()
  return useMutation({ mutationFn: createAdminStorefrontHeroSlide, onSuccess: invalidate })
}

export async function updateAdminStorefrontHeroSlide({
  id,
  ...payload
}: AdminStorefrontHeroSlideForm & { id: string }) {
  const { data } = await http(`/admin/storefront/hero-slides/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminStorefrontHeroSlideResponseSchema,
  })
  return data
}

export function useUpdateAdminStorefrontHeroSlide() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateHero()
  const key = adminHeroKeys.all

  return useMutation({
    mutationFn: updateAdminStorefrontHeroSlide,
    onMutate: async ({ id, heading, isVisible }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontHeroSlide[]>(key)
      if (previous) {
        queryClient.setQueryData(
          key,
          previous.map((slide) => (slide.id === id ? { ...slide, heading, isVisible } : slide))
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

export async function deleteAdminStorefrontHeroSlide(id: string) {
  await http(`/admin/storefront/hero-slides/${id}`, {
    method: 'DELETE',
    schema: EmptyResponseSchema,
  })
}

export function useDeleteAdminStorefrontHeroSlide() {
  const invalidate = useInvalidateHero()
  return useMutation({ mutationFn: deleteAdminStorefrontHeroSlide, onSuccess: invalidate })
}

export async function reorderAdminStorefrontHeroSlides(ids: string[]) {
  await http('/admin/storefront/hero-slides/reorder', {
    method: 'PUT',
    body: { ids },
    schema: EmptyResponseSchema,
  })
}

export function useReorderAdminStorefrontHeroSlides() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateHero()
  const key = adminHeroKeys.all

  return useMutation({
    mutationFn: reorderAdminStorefrontHeroSlides,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<AdminStorefrontHeroSlide[]>(key)
      if (previous) {
        const byId = new Map(previous.map((slide) => [slide.id, slide]))
        queryClient.setQueryData(
          key,
          ids.flatMap((id, position) => {
            const slide = byId.get(id)
            return slide ? [{ ...slide, position }] : []
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

export async function uploadAdminStorefrontHeroSlideImage({
  id,
  file,
}: {
  id: string
  file: File
}) {
  const body = new FormData()
  body.append('image', file)
  const { data } = await http(`/admin/storefront/hero-slides/${id}/image`, {
    method: 'POST',
    body,
    schema: AdminStorefrontHeroSlideResponseSchema,
  })
  return data
}

export function useUploadAdminStorefrontHeroSlideImage() {
  const invalidate = useInvalidateHero()
  return useMutation({ mutationFn: uploadAdminStorefrontHeroSlideImage, onSuccess: invalidate })
}

export async function removeAdminStorefrontHeroSlideImage(id: string) {
  const { data } = await http(`/admin/storefront/hero-slides/${id}/image`, {
    method: 'DELETE',
    schema: AdminStorefrontHeroSlideResponseSchema,
  })
  return data
}

export function useRemoveAdminStorefrontHeroSlideImage() {
  const invalidate = useInvalidateHero()
  return useMutation({ mutationFn: removeAdminStorefrontHeroSlideImage, onSuccess: invalidate })
}
