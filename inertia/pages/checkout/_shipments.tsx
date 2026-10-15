import { ExternalLink, Truck } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'
import { type CheckoutShipment } from './_types'

type ShipmentsProps = {
  shipments: CheckoutShipment[]
  formatDate: (value: string) => string
  className?: string
}

const itemLabel = (line: CheckoutShipment['lines'][number]) =>
  line.variantTitle && line.variantTitle !== 'Default Title'
    ? `${line.productTitle} · ${line.variantTitle}`
    : line.productTitle

/** The order's shipments with their items and tracking links. */
export default function Shipments({ shipments, formatDate, className }: ShipmentsProps) {
  if (shipments.length === 0) return null

  return (
    <section className={cn(storefront.card, 'flex flex-col gap-4 p-5 text-[14px]', className)}>
      <h2 className="font-semibold">Shipments</h2>
      <ul className="flex flex-col divide-y divide-sf-line">
        {shipments.map((shipment) => {
          const carrier = [shipment.trackingCompany, shipment.trackingNumber]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={shipment.number} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-medium">Shipment {shipment.number}</p>
                <p className="text-[13px] text-sf-muted">{formatDate(shipment.createdAt)}</p>
              </div>
              {carrier && (
                <p className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-sf-muted">
                  <Truck size={14} className="flex-none" aria-hidden="true" />
                  {shipment.trackingUrl ? (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-sf-primary hover:underline"
                    >
                      <span className="truncate">{carrier}</span>
                      <ExternalLink size={12} className="flex-none" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="truncate">{carrier}</span>
                  )}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {shipment.lines.map((line) => (
                  <li key={line.lineItemId} className="flex justify-between gap-3 text-[13.5px]">
                    <span className="min-w-0 truncate">{itemLabel(line)}</span>
                    <span className="flex-none text-sf-muted">× {line.quantity}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
