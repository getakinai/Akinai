import { useQuery } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storefrontKeys } from '~/pages/_hooks'
import { StorefrontHeroSlidesResponseSchema } from '~/pages/_types'

export async function fetchStorefrontHeroSlides() {
  const { data } = await http('/store/hero-slides', {
    schema: StorefrontHeroSlidesResponseSchema,
  })
  return data
}

export function useStorefrontHeroSlides() {
  return useQuery({
    queryKey: storefrontKeys.heroSlides,
    queryFn: fetchStorefrontHeroSlides,
    staleTime: 5 * 60 * 1000,
  })
}
