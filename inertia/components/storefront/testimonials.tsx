import { Link } from '@adonisjs/inertia/react'
import { Skeleton, StarRating } from '~/components/ui'
import { cn, storefront } from '~/lib/styles'
import SectionHeader from './section_header'

export type Testimonial = {
  id: string
  rating: number
  title: string | null
  body: string
  authorName: string
  product: { title: string; slug: string } | null
}

type TestimonialsProps = {
  items: Testimonial[]
  title?: string
  className?: string
}

/**
 * Customer reviews featured by staff. Each links to the reviewed product.
 */
export default function Testimonials({
  items,
  title = 'What our customers say',
  className,
}: TestimonialsProps) {
  return (
    <section className={className} aria-labelledby="testimonials-title">
      <SectionHeader id="testimonials-title" title={title} />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className={cn(storefront.card, 'flex min-w-0 flex-col gap-3 p-5')}>
            <span className="text-sf-accent">
              <StarRating value={item.rating} size="sm" />
              <span className="sr-only">{item.rating} out of 5 stars</span>
            </span>
            {item.title && <p className="text-[15px] font-semibold break-words">{item.title}</p>}
            <p className="line-clamp-6 text-[14.5px] leading-relaxed break-words whitespace-pre-line">
              “{item.body}”
            </p>
            <div className="mt-auto flex min-w-0 flex-col gap-0.5 pt-1">
              <span className="truncate text-[14px] font-semibold">{item.authorName}</span>
              {item.product && (
                <Link
                  route="storefront.products.show"
                  routeParams={{ slug: item.product.slug }}
                  className="truncate text-[13px] text-sf-muted hover:text-sf-primary hover:underline"
                >
                  {item.product.title}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TestimonialsSkeleton({ className }: { className?: string }) {
  return (
    <section className={className} aria-hidden="true">
      <Skeleton className="mb-4 h-6 w-56 max-w-full sm:mb-5" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={cn(storefront.card, 'flex min-w-0 flex-col gap-3 p-5')}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="w-full" />
            <Skeleton className="w-full" />
            <Skeleton className="w-2/3" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>
    </section>
  )
}
