import { useState } from 'react'
import { ImagePlaceholder, LoadingImage, ProductLabelBadge } from '~/components/storefront'
import type { ProductLabelBadgeData } from '~/lib/product_label'
import { cn } from '~/lib/styles'

type GalleryProps = {
  title: string
  images: string[]
  onSale: boolean
  label: ProductLabelBadgeData | null
}

/**
 * Main product photo with a thumbnail strip: a scrolling row under the
 * photo on small screens, a column to its left from `lg`.
 */
export default function Gallery({ title, images, onSale, label }: GalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:items-start">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-card bg-white">
        {current ? (
          <LoadingImage
            key={current}
            src={current}
            alt={title}
            width={900}
            height={900}
            className="aspect-square w-full object-contain p-6 sm:p-10"
          />
        ) : (
          <ImagePlaceholder className="aspect-square" iconSize={36} />
        )}
        {(label || onSale) && (
          <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1.5">
            {label && <ProductLabelBadge label={label} className="text-[12px]" />}
            {onSale && (
              <span className="rounded-md bg-sf-accent px-2 py-0.5 text-[12px] font-semibold text-sf-text">
                Sale
              </span>
            )}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul
          aria-label="Product photos"
          className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:max-h-[560px] lg:w-20 lg:flex-none lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pr-1 lg:pb-0"
        >
          {images.map((src, index) => (
            <li key={src} className="flex-none">
              <button
                type="button"
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  'block size-16 overflow-hidden rounded-lg border-2 bg-white transition-[border-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring lg:size-20',
                  index === active
                    ? 'border-sf-primary'
                    : 'border-transparent opacity-75 hover:opacity-100'
                )}
              >
                <LoadingImage
                  src={src}
                  alt=""
                  loading="lazy"
                  width={160}
                  height={160}
                  className="size-full object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
