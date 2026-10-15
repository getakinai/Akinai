import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import {
  SupportMessages,
  SupportReplyBox,
  SupportStatusBadge,
} from '~/components/storefront/support_thread'
import { Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import AccountPage from '../_account_page'
import { useAccountFormat } from '../_format'
import { useCustomerSupportThread, useReplyCustomerSupportThread } from './_hooks'

export default function CustomerAccountSupportShow({ id }: { id: string }) {
  const { data: thread, isLoading, isError } = useCustomerSupportThread(id)
  const reply = useReplyCustomerSupportThread(id)
  const format = useAccountFormat()
  const title = thread ? `Request ${thread.ticket.reference}` : 'Support request'

  return (
    <AccountPage
      title={title}
      heading={isLoading ? <Skeleton className="h-8 w-48" /> : title}
      eyebrow={
        <Link
          route="customers.account.support.home"
          className="inline-flex items-center gap-1 hover:text-sf-text"
        >
          <ArrowLeft size={12} /> Support
        </Link>
      }
      description={thread ? `Sent ${format.dateTime(thread.ticket.createdAt)}` : undefined}
      actions={thread && <SupportStatusBadge status={thread.ticket.status} />}
    >
      {isLoading && <Skeleton className="h-64 w-full rounded-card" />}

      {isError && (
        <div className={cn(storefront.card, 'p-8 text-center')}>
          <p className="text-[16px] font-semibold">We couldn’t find this request</p>
          <p className="mt-1 text-[14px] text-sf-muted">It may belong to a different account.</p>
        </div>
      )}

      {thread && (
        <>
          <section className={cn(storefront.card, 'p-4 sm:p-5')}>
            <SupportMessages messages={thread.messages} />
          </section>
          <SupportReplyBox
            closed={thread.ticket.status === 'closed'}
            isPending={reply.isPending}
            onSend={(payload, callbacks) => reply.mutate(payload, callbacks)}
          />
        </>
      )}
    </AccountPage>
  )
}

CustomerAccountSupportShow.layout = [StorefrontLayout, AccountLayout]
