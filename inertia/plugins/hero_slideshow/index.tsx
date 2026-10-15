import type { PluginSlotProps } from '../types'
import { useStorefrontHeroSlides } from './_hooks'
import HeroSlider, { HeroSliderSkeleton } from './hero_slider'

/** Shows the slot's fallback when staff have not added a visible slide. */
export default function HeroSlideshowPlugin({ fallback }: PluginSlotProps) {
  const { data: slides, isLoading } = useStorefrontHeroSlides()
  if (isLoading) return <HeroSliderSkeleton />
  if (!slides || slides.length === 0) return <>{fallback}</>
  return <HeroSlider slides={slides} />
}
