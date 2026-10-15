import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { handleMutationError } from '~/lib/form'
import { HttpError, type FieldErrors } from '~/lib/http'
import { useCan } from '../../_hooks'
import { draftLabel } from '../_format'
import {
  useCompleteDraftOrder,
  useCreateDraftOrder,
  useDeleteDraftOrder,
  useDraftOrderQuote,
  useUpdateDraftOrder,
} from '../_hooks'
import {
  type AdminOrderDetail,
  type DraftCustomer,
  type DraftLine,
  type DraftOrderPayload,
  type ManualPaymentStatus,
} from '../_types'
import CustomerCard from './_customer_card'
import MarketCard from './_market_card'
import PaymentCard from './_payment_card'
import ProductsCard from './_products_card'

type DraftOrderFormProps = {
  /** Saved draft being edited; omit when creating. */
  draft?: AdminOrderDetail
}

const completeCopy: Record<ManualPaymentStatus, { title: string; action: string; done: string }> = {
  paid: {
    title: 'Mark as paid?',
    action: 'Mark as paid',
    done: 'Order created and marked as paid',
  },
  pending: {
    title: 'Create order with payment pending?',
    action: 'Create order',
    done: 'Order created with payment pending',
  },
}

function initialLines(draft?: AdminOrderDetail): DraftLine[] {
  return (draft?.lineItems ?? []).flatMap((line) =>
    line.productVariantId
      ? [
          {
            variantId: line.productVariantId,
            productTitle: line.productTitle,
            variantTitle: line.variantTitle,
            sku: line.sku,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          },
        ]
      : []
  )
}

export default function DraftOrderForm({ draft }: DraftOrderFormProps) {
  const canEdit = useCan(draft ? 'orders.edit' : 'orders.create')
  const canDelete = useCan('orders.archive')
  const [lines, setLines] = useState<DraftLine[]>(() => initialLines(draft))
  const [customer, setCustomer] = useState<DraftCustomer | null>(draft?.customer ?? null)
  const [shippingAddressId, setShippingAddressId] = useState(draft?.shippingAddressId ?? null)
  const [marketId, setMarketId] = useState(draft?.marketId ?? null)
  const [discountCode, setDiscountCode] = useState(draft?.discountCode ?? null)
  const [shippingRateId, setShippingRateId] = useState(draft?.shippingRateId ?? null)
  const [saveErrors, setSaveErrors] = useState<FieldErrors>({})
  const [confirming, setConfirming] = useState<ManualPaymentStatus | null>(null)
  const [deleting, setDeleting] = useState(false)

  const createDraft = useCreateDraftOrder()
  const updateDraft = useUpdateDraftOrder()
  const completeDraft = useCompleteDraftOrder()
  const deleteDraft = useDeleteDraftOrder()

  const droppedLines = (draft?.lineItems.length ?? 0) - initialLines(draft).length
  const quantitiesValid = lines.every(
    (line) => line.quantity !== null && Number.isInteger(line.quantity) && line.quantity >= 1
  )

  const payload = useMemo<DraftOrderPayload>(
    () => ({
      lineItems: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity ?? 0 })),
      customerId: customer?.id ?? null,
      shippingAddressId,
      marketId,
      discountCode,
      shippingRateId,
    }),
    [lines, customer, shippingAddressId, marketId, discountCode, shippingRateId]
  )
  const debouncedPayload = useDebouncedValue(payload, 350)
  const quoteQuery = useDraftOrderQuote(quantitiesValid ? debouncedPayload : null)
  const quote = quoteQuery.isError ? undefined : quoteQuery.data
  const quoteErrors =
    quoteQuery.error instanceof HttpError ? quoteQuery.error.fieldErrors : ({} as FieldErrors)
  const errors = { ...quoteErrors, ...saveErrors }

  const currencyCode = quote?.market.currencyCode ?? draft?.currencyCode ?? ''
  const lineTotals = useMemo(
    () => new Map((quote?.lineItems ?? []).map((line) => [line.productVariantId, line.lineTotal])),
    [quote]
  )
  const itemCount = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0)
  const isSaving = createDraft.isPending || updateDraft.isPending
  const disabled = !canEdit || isSaving || completeDraft.isPending

  const touch = () => setSaveErrors({})

  const changeCustomer = useCallback(
    (next: DraftCustomer | null, defaultAddressId: string | null) => {
      setCustomer(next)
      setShippingAddressId(defaultAddressId)
      setShippingRateId(null)
      setSaveErrors({})
    },
    []
  )

  const changeAddress = useCallback((addressId: string | null) => {
    setShippingAddressId(addressId)
    setShippingRateId(null)
    setSaveErrors({})
  }, [])

  const validateLocally = () => {
    if (lines.length === 0) {
      setSaveErrors({ lineItems: 'Add at least one product' })
      return false
    }
    if (!quantitiesValid) {
      setSaveErrors({ lineItems: 'Enter a whole-number quantity of at least 1 for every product' })
      return false
    }
    return true
  }

  const save = () => {
    if (!validateLocally()) return
    if (draft) {
      updateDraft.mutate(
        { id: draft.id, ...payload },
        {
          onSuccess: (saved) => toast.success(`Draft ${draftLabel(saved.draftNumber)} saved`),
          onError: (error) => handleMutationError(error, setSaveErrors),
        }
      )
      return
    }
    createDraft.mutate(payload, {
      onSuccess: (saved) => {
        toast.success(`Draft ${draftLabel(saved.draftNumber)} created`)
        router.visit(`/admin/orders/drafts/edit/${saved.id}`)
      },
      onError: (error) => handleMutationError(error, setSaveErrors),
    })
  }

  const complete = async (paymentStatus: ManualPaymentStatus) => {
    if (!draft || !validateLocally()) return setConfirming(null)
    try {
      await updateDraft.mutateAsync({ id: draft.id, ...payload })
      const order = await completeDraft.mutateAsync({ id: draft.id, paymentStatus })
      toast.success(completeCopy[paymentStatus].done)
      router.visit(`/admin/orders/show/${order.id}`)
    } catch (error) {
      handleMutationError(error, setSaveErrors)
    } finally {
      setConfirming(null)
    }
  }

  const remove = () => {
    if (!draft) return
    deleteDraft.mutate(draft.id, {
      onSuccess: () => {
        toast.success(`Draft ${draftLabel(draft.draftNumber)} deleted`)
        router.visit('/admin/orders/drafts')
      },
      onError: (error) => {
        setDeleting(false)
        handleMutationError(error, setSaveErrors)
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="flex min-w-0 flex-col gap-6">
        {droppedLines > 0 && (
          <p className="rounded-card border border-warning/30 bg-warning-soft px-5 py-3 text-[13.5px] text-warning">
            {droppedLines === 1
              ? 'A product on this draft was'
              : `${droppedLines} products on this draft were`}{' '}
            deleted from the catalog and removed from the order.
          </p>
        )}

        <ProductsCard
          lines={lines}
          onChange={(next) => {
            setLines(next)
            touch()
          }}
          currencyCode={currencyCode}
          lineTotals={lineTotals}
          errors={errors}
          disabled={disabled}
        />

        <PaymentCard
          quote={quote}
          isCalculating={quoteQuery.isFetching}
          hasLines={lines.length > 0}
          itemCount={itemCount}
          currencyCode={currencyCode}
          discountCode={discountCode}
          onDiscountCodeChange={(code) => {
            setDiscountCode(code)
            touch()
          }}
          shippingRateId={shippingRateId}
          onShippingRateChange={(rateId) => {
            setShippingRateId(rateId)
            touch()
          }}
          hasAddress={shippingAddressId !== null}
          errors={errors}
          disabled={disabled}
          actions={
            draft &&
            canEdit && (
              <>
                <FormButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => setConfirming('pending')}
                >
                  Payment pending
                </FormButton>
                <FormButton type="button" disabled={disabled} onClick={() => setConfirming('paid')}>
                  Mark as paid
                </FormButton>
              </>
            )
          }
        />

        {canEdit && (
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {draft && canDelete && (
              <FormButton
                type="button"
                variant="danger"
                className="mr-auto"
                disabled={disabled}
                onClick={() => setDeleting(true)}
              >
                Delete draft
              </FormButton>
            )}
            <FormButton
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => router.visit('/admin/orders/drafts')}
            >
              Cancel
            </FormButton>
            <FormButton type="button" loading={isSaving} loadingText="Saving…" onClick={save}>
              Save draft
            </FormButton>
          </div>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        <CustomerCard
          customer={customer}
          onCustomerChange={changeCustomer}
          shippingAddressId={shippingAddressId}
          onShippingAddressChange={changeAddress}
          savedAddress={draft?.shippingAddress ?? null}
          errors={errors}
          disabled={disabled}
        />
        <MarketCard
          marketId={marketId}
          onChange={(id) => {
            setMarketId(id)
            touch()
          }}
          resolved={quote?.market ?? null}
          errors={errors}
          disabled={disabled}
        />
      </aside>

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? completeCopy[confirming].title : ''}
        description="This saves the draft, turns it into an order and takes the products out of stock. It can’t be turned back into a draft."
        className="w-[min(440px,calc(100vw-24px))]"
      >
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" onClick={() => setConfirming(null)}>
            Cancel
          </FormButton>
          <FormButton
            type="button"
            loading={updateDraft.isPending || completeDraft.isPending}
            loadingText="Creating order…"
            onClick={() => confirming && complete(confirming)}
          >
            {confirming ? completeCopy[confirming].action : 'Confirm'}
          </FormButton>
        </div>
      </Dialog>

      <Dialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this draft?"
        description="The draft and its products are removed. This can’t be undone."
        className="w-[min(440px,calc(100vw-24px))]"
      >
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" onClick={() => setDeleting(false)}>
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            loading={deleteDraft.isPending}
            loadingText="Deleting…"
            onClick={remove}
          >
            Delete draft
          </FormButton>
        </div>
      </Dialog>
    </div>
  )
}
