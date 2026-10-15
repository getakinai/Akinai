import { Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { useCustomerMe } from '../../_hooks'
import type { Customer } from '../../_types'
import AccountPage, { ErrorState } from '../_account_page'
import { useAccountFormat } from '../_format'
import DetailsForm from './_details_form'
import MarketingCard from './_marketing_card'

/** Resets the form after its own fields change, not after the marketing switch. */
function detailsKey(customer: Customer) {
  return [
    customer.id,
    customer.fullName,
    customer.email,
    customer.phone,
    customer.countryCode,
    customer.timezone,
  ].join('|')
}

export default function CustomerAccountDetailsHome() {
  const customer = useCustomerMe()
  const format = useAccountFormat()

  return (
    <AccountPage
      title="Account details"
      description={
        customer.data
          ? `Member since ${format.date(customer.data.createdAt)}.`
          : 'The details we use to contact you.'
      }
    >
      {customer.isLoading && <Skeleton className="h-64 w-full rounded-card" />}
      {customer.isError && (
        <ErrorState message="We couldn’t load your account." onRetry={() => customer.refetch()} />
      )}
      {customer.data && (
        <div className="flex flex-col gap-5">
          <DetailsForm key={detailsKey(customer.data)} customer={customer.data} />
          <MarketingCard customer={customer.data} />
        </div>
      )}
    </AccountPage>
  )
}

CustomerAccountDetailsHome.layout = [StorefrontLayout, AccountLayout]
