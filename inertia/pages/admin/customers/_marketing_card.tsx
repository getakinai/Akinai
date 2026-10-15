import { toast } from 'sonner'
import { FormSwitch } from '~/components/form'
import Section from '~/components/section'
import { HttpError } from '~/lib/http'
import { panel } from '~/lib/styles'
import { useUpdateAdminCustomerMarketing } from './_hooks'
import { type AdminCustomerDetail, type MARKETING_CONSENT_SOURCES } from './_types'

const SOURCE_LABELS: Record<(typeof MARKETING_CONSENT_SOURCES)[number], string> = {
  signup: 'when signing up',
  checkout: 'at checkout',
  newsletter: 'from the newsletter form',
  account: 'in their account',
  admin: 'by staff',
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type MarketingCardProps = {
  customer: AdminCustomerDetail
  editable: boolean
}

/** Email marketing consent, with when and where it last changed. */
export default function MarketingCard({ customer, editable }: MarketingCardProps) {
  const updateMarketing = useUpdateAdminCustomerMarketing()

  const history =
    customer.marketingConsentAt && customer.marketingConsentSource
      ? `${customer.acceptsMarketing ? 'Subscribed' : 'Unsubscribed'} ${
          SOURCE_LABELS[customer.marketingConsentSource]
        } on ${dateTimeFormat.format(new Date(customer.marketingConsentAt))}.`
      : 'No marketing choice recorded yet.'

  function onToggle(acceptsMarketing: boolean) {
    updateMarketing.mutate(
      { id: customer.id, acceptsMarketing },
      {
        onSuccess: () =>
          toast.success(acceptsMarketing ? 'Marked as subscribed' : 'Marked as unsubscribed'),
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
      }
    )
  }

  return (
    <div className={panel}>
      <Section
        title="Email marketing"
        description="Only send news, promotions and discounts to subscribed customers."
      >
        <FormSwitch
          name="acceptsMarketing"
          label="Subscribed to marketing emails"
          hint={editable ? `${history} Only change this when the customer asks you to.` : history}
          checked={customer.acceptsMarketing}
          disabled={!editable || updateMarketing.isPending}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </Section>
    </div>
  )
}
