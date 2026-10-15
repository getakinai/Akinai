import BankTransferDialog from './_bank_transfer_dialog'
import {
  useAdminBankTransfer,
  useAdminPaymentMarkets,
  useAdminPoli,
  useAdminStripe,
} from './_hooks'
import PoliDialog from './_poli_dialog'
import StripeDialog from './_stripe_dialog'

/** Payment methods set up through a dialog on the Payments and Plugins pages. */
export const MANAGED_CODES = ['bank_transfer', 'stripe', 'poli'] as const

export type ManagedCode = (typeof MANAGED_CODES)[number]

export const isManaged = (code: string): code is ManagedCode =>
  MANAGED_CODES.some((managed) => managed === code)

/** Setup dialog of the open payment method; loads its setup only while open. */
export function PaymentMethodDialog({
  code,
  initialMarketId,
  onClose,
}: {
  code: ManagedCode | null
  initialMarketId: string | null
  onClose: () => void
}) {
  const bankTransfer = useAdminBankTransfer(code === 'bank_transfer')
  const stripe = useAdminStripe(code === 'stripe')
  const poli = useAdminPoli(code === 'poli')
  const markets = useAdminPaymentMarkets(code === 'stripe' || code === 'poli')

  if (code === 'bank_transfer' && bankTransfer.data) {
    return (
      <BankTransferDialog
        open
        setup={bankTransfer.data}
        initialMarketId={initialMarketId}
        onClose={onClose}
      />
    )
  }
  if (code === 'stripe' && stripe.data && markets.data) {
    return <StripeDialog open setup={stripe.data} markets={markets.data} onClose={onClose} />
  }
  if (code === 'poli' && poli.data && markets.data) {
    return <PoliDialog open setup={poli.data} markets={markets.data} onClose={onClose} />
  }
  return null
}
