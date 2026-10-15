import type { QueryClient } from '@tanstack/react-query'
import type { PluginSlotProps } from '~/plugins/types'
import { storefrontKeys } from '~/pages/_hooks'
import { StorefrontHeroSlideSchema } from '~/pages/_types'
import { z } from 'zod'
import { useStorefrontHeroSlides } from './_hooks'
import HeroSlider, { HeroSliderSkeleton } from './hero_slider'

const HeroSlidesPrefetchSchema = z.array(StorefrontHeroSlideSchema)

function HeroSlideshowPlugin({ fallback }: PluginSlotProps) {
  const { data: slides, isLoading } = useStorefrontHeroSlides()
  if (isLoading) return <HeroSliderSkeleton />
  if (!slides || slides.length === 0) return <>{fallback}</>
  return <HeroSlider slides={slides} />
}

export default {
  slot: 'home.hero' as const,
  Component: HeroSlideshowPlugin,
  Skeleton: HeroSliderSkeleton,
  seedQueries(queryClient: QueryClient, data: unknown) {
    const parsed = HeroSlidesPrefetchSchema.safeParse(data)
    if (parsed.success) {
      queryClient.setQueryData(storefrontKeys.heroSlides, parsed.data)
    }
  },
  adminNav: {
    parentRoute: 'admin.storefront_content.home' as const,
    items: [
      {
        label: 'Hero',
        route: 'admin.storefront_hero.home' as const,
        permission: 'storefront.view',
      },
    ],
  },
}
