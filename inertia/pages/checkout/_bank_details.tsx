import { type CheckoutBankTransfer } from './_types'

type BankDetailsProps = {
  bank: CheckoutBankTransfer
  reference?: string
}

export default function BankDetails({ bank, reference }: BankDetailsProps) {
  const rows = [
    { label: 'Account name', value: bank.accountName },
    { label: 'Bank', value: bank.bankName },
    ...(bank.bsb ? [{ label: 'BSB', value: bank.bsb }] : []),
    { label: 'Account number', value: bank.accountNumber },
    ...(reference ? [{ label: 'Reference', value: reference }] : []),
  ]

  return (
    <div className="flex flex-col gap-2 text-[13.5px]">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 min-[400px]:grid-cols-[auto_minmax(0,1fr)]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-sf-muted">{row.label}</dt>
            <dd className="mb-1.5 font-medium break-words tabular-nums min-[400px]:mb-0">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {bank.instructions && (
        <p className="whitespace-pre-line text-sf-muted">{bank.instructions}</p>
      )}
    </div>
  )
}
