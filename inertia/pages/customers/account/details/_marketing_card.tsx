import { toast } from 'sonner'
import { FormSwitch } from '~/components/form'
import { HttpError } from '~/lib/http'
import { MARKETING_CONSENT_HINT, MARKETING_CONSENT_LABEL } from '~/lib/marketing'
import { cn, storefront } from '~/lib/styles'
import { useUpdateCustomerMarketing } from '../../_hooks'
import type { Customer } from '../../_types'

/** Saves as soon as the switch is flipped. */
export default function MarketingCard({ customer }: { customer: Customer }) {
  const updateMarketing = useUpdateCustomerMarketing()

  function onToggle(acceptsMarketing: boolean) {
    updateMarketing.mutate(
      { acceptsMarketing },
      {
        onSuccess: () =>
          toast.success(
            acceptsMarketing
              ? 'You’re subscribed to news and offers'
              : 'You won’t get marketing emails anymore'
          ),
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
      }
    )
  }

  return (
    <section
      className={cn(storefront.card, 'flex flex-col gap-3 p-5')}
      aria-labelledby="marketing-heading"
    >
      <div>
        <h2 id="marketing-heading" className="text-[15px] font-semibold text-sf-text">
          Marketing emails
        </h2>
        <p className="mt-1 text-[13px] text-sf-muted">
          Order updates are always sent. This only covers news, promotions and discounts.
        </p>
      </div>
      <FormSwitch
        name="acceptsMarketing"
        label={MARKETING_CONSENT_LABEL}
        hint={MARKETING_CONSENT_HINT}
        tone="storefront"
        checked={customer.acceptsMarketing}
        disabled={updateMarketing.isPending}
        onChange={(event) => onToggle(event.target.checked)}
      />
    </section>
  )
}
