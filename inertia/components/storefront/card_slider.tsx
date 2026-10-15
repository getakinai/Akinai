import { useCallback, useSyncExternalStore } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import ImagePlaceholder from './image_placeholder'
import LoadingImage from './loading_image'

export type CardSliderItem = {
  id: string
  label: string
  href?: string
  imageUrl?: string | null
}

const EVENTS = ['init', 'reInit', 'resize', 'select', 'settle', 'slidesInView'] as const

const noState = () => 'none'

const slide = 'min-w-0 flex-none basis-[42%] pl-3 sm:basis-[30%] sm:pl-4 md:basis-1/5 lg:basis-1/6'

const card = cn(storefront.card, 'group flex h-full flex-col overflow-hidden text-center')

const linkCard =
  'transition-[box-shadow,translate] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'

const arrow =
  'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-sf-line bg-sf-surface text-sf-text shadow-md transition-[opacity,scale] duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none'

function CardContent({
  label,
  imageUrl,
  linked,
}: {
  label: string
  imageUrl?: string | null
  linked: boolean
}) {
  const hoverZoom = linked && 'transition-transform duration-200 motion-safe:group-hover:scale-105'

  return (
    <>
      <div className="p-3 pb-0 sm:p-3.5 sm:pb-0">
        <div className="aspect-square overflow-hidden rounded-lg bg-white">
          {imageUrl ? (
            <LoadingImage
              src={imageUrl}
              alt=""
              loading="lazy"
              width={320}
              height={320}
              className={cn('size-full object-contain p-3 sm:p-4', hoverZoom)}
            />
          ) : (
            <ImagePlaceholder className="size-full" iconSize={26} />
          )}
        </div>
      </div>
      <span className="line-clamp-2 p-3 text-[13.5px] leading-tight font-semibold text-sf-primary sm:p-3.5 sm:text-[14.5px]">
        {label}
      </span>
    </>
  )
}

/**
 * Horizontally sliding image cards (categories, brands) with previous/next
 * arrows. Swipe or drag on touch screens. The arrows show only when the
 * cards overflow and dim at either end. Items without `href` render as
 * plain cards.
 */
export default function CardSlider({
  items,
  label,
  itemsLabel = 'items',
}: {
  items: CardSliderItem[]
  label: string
  itemsLabel?: string
}) {
  const [viewportRef, api] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  })
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
  const state = useSyncExternalStore(
    subscribe,
    () => {
      if (!api || api.scrollSnapList().length < 2) return 'none'
      return `${api.canScrollPrev() ? 'prev' : ''}-${api.canScrollNext() ? 'next' : ''}`
    },
    noState
  )
  const overflows = state !== 'none'

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={viewportRef} className="overflow-hidden py-2">
        <ul className="-ml-3 flex touch-pan-y sm:-ml-4">
          {items.map((item) => (
            <li key={item.id} className={slide}>
              {item.href ? (
                <a href={item.href} className={cn(card, linkCard)}>
                  <CardContent label={item.label} imageUrl={item.imageUrl} linked />
                </a>
              ) : (
                <div className={card}>
                  <CardContent label={item.label} imageUrl={item.imageUrl} linked={false} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {overflows && (
        <>
          <button
            type="button"
            className={cn(arrow, 'left-0 -translate-x-1/3 max-sm:left-1 max-sm:translate-x-0')}
            onClick={() => api?.scrollPrev()}
            disabled={!state.includes('prev')}
            aria-label={`Previous ${itemsLabel}`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={cn(arrow, 'right-0 translate-x-1/3 max-sm:right-1 max-sm:translate-x-0')}
            onClick={() => api?.scrollNext()}
            disabled={!state.includes('next')}
            aria-label={`Next ${itemsLabel}`}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  )
}

export function CardSliderSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="overflow-hidden py-2" aria-hidden="true">
      <div className="-ml-3 flex sm:-ml-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={slide}>
            <div className={card}>
              <div className="p-3 pb-0 sm:p-3.5 sm:pb-0">
                <ImagePlaceholder className="aspect-square rounded-lg" loading />
              </div>
              <span className="mx-auto my-3 h-3.5 w-2/3 rounded bg-sf-line motion-safe:animate-pulse sm:my-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
