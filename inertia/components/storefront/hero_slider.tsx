import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ChevronLeft, ChevronRight, Leaf } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import ImagePlaceholder from './image_placeholder'
import LoadingImage from './loading_image'

export type HeroSlide = {
  id: string
  eyebrow: string | null
  heading: string
  subheading: string | null
  buttonLabel: string | null
  imageUrl: string | null
  href: string
  isExternal: boolean
}

const AUTOPLAY_MS = 6000

const EVENTS = ['init', 'reInit', 'select'] as const

const shell = 'mt-5 overflow-hidden rounded-card bg-sf-primary text-sf-primary-fg sm:mt-7'

const panel = 'grid h-full grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]'

const media = 'min-h-[200px] md:min-h-[340px]'

const arrow =
  'grid size-9 place-items-center rounded-full bg-sf-primary-fg/15 text-sf-primary-fg transition-[background-color,scale] duration-150 hover:bg-sf-primary-fg/25 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function SlideContent({
  slide,
  first,
  withControls,
}: {
  slide: HeroSlide
  first: boolean
  withControls: boolean
}) {
  const Heading = first ? 'h1' : 'h2'
  return (
    <div className={slide.imageUrl ? panel : 'h-full'}>
      <div
        className={cn(
          'flex h-full min-w-0 flex-col justify-center gap-4 p-6 sm:p-10 md:min-h-[340px]',
          withControls && 'md:pb-16'
        )}
      >
        {slide.eyebrow && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sf-primary-fg/10 px-3 py-1 text-[12.5px] font-medium">
            <Leaf size={14} className="text-sf-accent" /> {slide.eyebrow}
          </span>
        )}
        <Heading className="text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-[42px]">
          {slide.heading}
        </Heading>
        {slide.subheading && (
          <p className={cn('text-[15px] opacity-85', slide.imageUrl ? 'max-w-md' : 'max-w-2xl')}>
            {slide.subheading}
          </p>
        )}
        <span className={cn(storefront.accentButton, 'w-fit')}>
          {slide.buttonLabel || 'Shop now'} <ArrowRight size={15} />
        </span>
      </div>
      {slide.imageUrl && (
        <div className={cn(media, 'relative overflow-hidden')}>
          <LoadingImage
            src={slide.imageUrl}
            alt=""
            loading={first ? 'eager' : 'lazy'}
            fetchPriority={first ? 'high' : 'auto'}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Home page hero. Each slide is one link. With two or more slides it loops,
 * shows arrows and dots, and advances every few seconds unless the shopper
 * hovers or focuses it, or prefers reduced motion.
 */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const multiple = slides.length > 1
  const [viewportRef, api] = useEmblaCarousel({ loop: multiple, active: multiple })
  const [paused, setPaused] = useState(false)

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {}
      for (const event of EVENTS) api.on(event, onChange)
      return () => {
        for (const event of EVENTS) api.off(event, onChange)
      }
    },
    [api]
  )
  const selected = useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0
  )

  useEffect(() => {
    if (!api || !multiple || paused || prefersReducedMotion()) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') api.scrollNext()
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [api, multiple, paused, selected])

  return (
    <div
      className={cn(shell, 'relative')}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <ul className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className="min-w-0 flex-none basis-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              inert={multiple && index !== selected}
            >
              <a
                href={slide.href}
                target={slide.isExternal ? '_blank' : undefined}
                rel={slide.isExternal ? 'noreferrer' : undefined}
                className="block h-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <SlideContent slide={slide} first={index === 0} withControls={multiple} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {multiple && (
        <div className="flex items-center gap-3 px-6 py-3 sm:px-10 md:absolute md:bottom-4 md:left-10 md:p-0">
          <button
            type="button"
            className={arrow}
            onClick={() => api?.scrollPrev()}
            aria-label="Previous slide"
          >
            <ChevronLeft size={17} />
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  'h-2 rounded-full transition-[width,background-color] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                  index === selected ? 'w-5 bg-sf-accent' : 'w-2 bg-sf-primary-fg/40'
                )}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            className={arrow}
            onClick={() => api?.scrollNext()}
            aria-label="Next slide"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  )
}

export function HeroSliderSkeleton() {
  return (
    <div className={shell} aria-hidden="true">
      <div className={panel}>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
          <span className="h-6 w-40 rounded-full bg-sf-primary-fg/10 motion-safe:animate-pulse" />
          <span className="h-9 w-4/5 rounded bg-sf-primary-fg/15 motion-safe:animate-pulse" />
          <span className="h-4 w-3/5 rounded bg-sf-primary-fg/10 motion-safe:animate-pulse" />
          <span className="h-10 w-28 rounded-lg bg-sf-primary-fg/15 motion-safe:animate-pulse" />
        </div>
        <ImagePlaceholder className={media} loading />
      </div>
    </div>
  )
}
