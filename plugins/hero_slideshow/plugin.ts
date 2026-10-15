import app from '@adonisjs/core/services/app'
import { definePlugin } from '#plugin_host/types'
import manifest from './manifest.js'
import { admin, storefront } from './server/routes.js'

export default definePlugin({
  manifest,
  routes: { admin, storefront },
  prefetch: {
    async home() {
      const { default: StorefrontHeroSlideService } =
        await import('./server/services/storefront_hero_slide_service.js')
      const { default: StorefrontHeroSlideTransformer } =
        await import('./server/transformers/storefront_hero_slide_transformer.js')
      const service = await app.container.make(StorefrontHeroSlideService)
      const slides = await service.listPublic()
      return StorefrontHeroSlideTransformer.transform(slides).useVariant('toPublic')
    },
  },
  async mediaUsages(key) {
    const { default: StorefrontHeroSlideRepository } =
      await import('./server/repositories/storefront_hero_slide_repository.js')
    const slides = await new StorefrontHeroSlideRepository().withImage(key)
    return slides.map((slide) => ({ type: 'hero_slide', label: `Hero slide: ${slide.heading}` }))
  },
})
