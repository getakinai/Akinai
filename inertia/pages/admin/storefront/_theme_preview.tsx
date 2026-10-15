import { useLayoutEffect, useRef, useState } from 'react'
import { Menu, Search, ShoppingBasket, UserRound } from 'lucide-react'
import { ProductCard, PromoBanner } from '~/components/storefront'
import { themeStyle, type ThemeColors } from '~/lib/storefront'
import { cn, storefront } from '~/lib/styles'

export type PreviewDevice = 'mobile' | 'web'

type ThemePreviewProps = {
  colors: ThemeColors
  device: PreviewDevice
  logoUrl: string | null
  brandName: string | null
}

const SAMPLE_PRODUCTS = [
  { title: 'Organic avocados', vendor: 'Green farm', price: '$4.50', compareAtPrice: '$5.90' },
  { title: 'Sourdough loaf', vendor: 'Local bakery', price: '$7.00', compareAtPrice: null },
  { title: 'Free-range eggs', vendor: 'Hillside farm', price: '$6.20', compareAtPrice: null },
  { title: 'Cold brew coffee', vendor: 'Roastery', price: '$5.80', compareAtPrice: '$6.50' },
]

const SAMPLE_MENU = ['Fresh produce', 'Bakery', 'Dairy', 'Pantry', 'Deals']

type BrandProps = {
  logoUrl: string | null
  brandName: string | null
}

function Brand({
  logoUrl,
  brandName,
  logoClassName,
  nameClassName,
}: BrandProps & { logoClassName: string; nameClassName: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {logoUrl && (
        <img src={logoUrl} alt="" className={cn('w-auto shrink-0 object-contain', logoClassName)} />
      )}
      <span className={cn('truncate font-semibold', nameClassName)}>
        {brandName || 'Your store'}
      </span>
    </span>
  )
}

function MobilePreview(brand: BrandProps) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] border-[6px] border-ink bg-sf-bg">
      <div className="bg-sf-primary px-3 py-1.5 text-center text-[11px] font-medium text-sf-primary-fg">
        Free delivery on your first order
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-sf-line bg-sf-surface px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <Menu size={15} className="shrink-0" />
          <Brand {...brand} logoClassName="h-6 max-w-[100px]" nameClassName="text-[13px]" />
        </span>
        <span className={cn(storefront.iconButton, 'size-8')}>
          <ShoppingBasket size={15} />
        </span>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <PromoBanner
          eyebrow="Weekly deal"
          title="20% off your first order"
          buttonLabel="Shop deals"
          href="#"
          className="p-4 sm:p-4 [&_p]:text-[16px] sm:[&_p]:text-[16px]"
        />
        <div className="grid grid-cols-2 gap-2.5">
          {SAMPLE_PRODUCTS.slice(0, 2).map((product) => (
            <ProductCard key={product.title} {...product} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WEB_WIDTH = 1024

/** Scale that fits a `WEB_WIDTH` layout into the measured element's width. */
function useFitZoom() {
  const ref = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.3)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setZoom(Math.min(1, entry.contentRect.width / WEB_WIDTH))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, zoom }
}

/**
 * Desktop layout drawn at 1024px and scaled down with `zoom` to fill the
 * preview column, whatever its width.
 */
function WebPreview(brand: BrandProps) {
  const { ref, zoom } = useFitZoom()

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden rounded-card border border-line-2">
      <div className="w-[1024px]" style={{ zoom }}>
        <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-line-2" />
            <span className="size-3 rounded-full bg-line-2" />
            <span className="size-3 rounded-full bg-line-2" />
          </span>
          <span className="mx-auto w-[420px] rounded-full bg-field px-4 py-1 text-center text-[13px] text-muted">
            yourstore.com
          </span>
        </div>
        <div className="bg-sf-bg">
          <div className="bg-sf-primary py-2 text-center text-[12.5px] font-medium text-sf-primary-fg">
            Free delivery on your first order. Fresh picks, packed daily.
          </div>
          <div className="border-b border-sf-line bg-sf-surface">
            <div className="flex items-center gap-6 px-8 py-3">
              <span className="max-w-[320px] shrink-0">
                <Brand {...brand} logoClassName="h-8 max-w-[180px]" nameClassName="text-[16px]" />
              </span>
              <span className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-sf-line px-3 text-[14px] text-sf-text/60">
                <Search size={16} />
                Search products
              </span>
              <span className="flex gap-2">
                <span className={storefront.iconButton}>
                  <UserRound size={18} />
                </span>
                <span className={storefront.iconButton}>
                  <ShoppingBasket size={18} />
                </span>
              </span>
            </div>
            <nav className="flex gap-1 px-6 pb-2">
              {SAMPLE_MENU.map((label) => (
                <span key={label} className={storefront.menuLink}>
                  {label}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-6 px-8 py-6">
            <PromoBanner
              eyebrow="Weekly deal"
              title="20% off your first order"
              buttonLabel="Shop deals"
              href="#"
              className="p-8 sm:p-8"
            />
            <div className="grid grid-cols-4 gap-4">
              {SAMPLE_PRODUCTS.map((product) => (
                <ProductCard key={product.title} {...product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A scaled-down storefront rendered with unsaved colors.
 */
export default function ThemePreview({ colors, device, logoUrl, brandName }: ThemePreviewProps) {
  return (
    <div
      data-storefront
      style={themeStyle(colors)}
      className="pointer-events-none min-w-0 text-sf-text select-none"
      aria-label={`Storefront preview, ${device === 'mobile' ? 'mobile' : 'web'} layout`}
      role="img"
    >
      {device === 'mobile' ? (
        <MobilePreview logoUrl={logoUrl} brandName={brandName} />
      ) : (
        <WebPreview logoUrl={logoUrl} brandName={brandName} />
      )}
    </div>
  )
}
