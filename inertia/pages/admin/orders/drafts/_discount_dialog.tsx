import { useState } from 'react'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'

type DiscountDialogProps = {
  open: boolean
  onClose: () => void
  code: string | null
  onApply: (code: string | null) => void
}

export default function DiscountDialog({ open, onClose, code, onApply }: DiscountDialogProps) {
  const [value, setValue] = useState(code ?? '')
  const [error, setError] = useState<string>()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add discount"
      description="Enter a discount code. It is checked against this order’s products and customer."
      className="w-[min(440px,calc(100vw-24px))]"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = value.trim().toUpperCase()
          if (!trimmed) return setError('Enter a discount code')
          onApply(trimmed)
          onClose()
        }}
      >
        <FormInput
          name="discountCode"
          label="Discount code"
          value={value}
          maxLength={64}
          autoComplete="off"
          autoFocus
          error={error}
          onChange={(event) => {
            setValue(event.target.value)
            setError(undefined)
          }}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          {code && (
            <FormButton
              type="button"
              variant="danger"
              className="mr-auto"
              onClick={() => {
                onApply(null)
                onClose()
              }}
            >
              Remove
            </FormButton>
          )}
          <FormButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton type="submit">Apply</FormButton>
        </div>
      </form>
    </Dialog>
  )
}
