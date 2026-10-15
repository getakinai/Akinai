import { Badge } from '~/components/ui'
import { card } from '~/lib/styles'
import { accountStateMeta } from './_format'
import { type AdminCustomerDetail } from './_types'

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 text-[13.5px] break-all text-ink">{value}</dd>
    </div>
  )
}

export default function AccountCard({ customer }: { customer: AdminCustomerDetail }) {
  const meta = accountStateMeta[customer.accountState]
  const { account } = customer

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Storefront account</span>
          <h2 className={card.title}>{account ? 'Account enabled' : 'No account'}</h2>
        </div>
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      </header>
      {account ? (
        <dl className="flex flex-col gap-3">
          <Row label="Sign-in email" value={account.email} />
          <Row label="Created" value={dateTimeFormat.format(new Date(account.createdAt))} />
          <Row
            label="Last sign-in"
            value={account.lastLoginAt ? dateTimeFormat.format(new Date(account.lastLoginAt)) : '—'}
          />
        </dl>
      ) : (
        <p className="text-[13.5px] text-pretty text-muted">
          This customer hasn&apos;t created a storefront account. If they sign up with{' '}
          <strong className="font-medium text-ink">{customer.email}</strong>, the account is linked
          to this profile.
        </p>
      )}
    </section>
  )
}
