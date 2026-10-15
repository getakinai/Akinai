import { Link } from '@adonisjs/inertia/react'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { openSupportChat } from '~/components/storefront/support_chat/events'
import { SupportStatusBadge } from '~/components/storefront/support_thread'
import { Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import AccountPage, { EmptyState, ErrorState } from '../_account_page'
import { useAccountFormat } from '../_format'
import { useCustomerSupportTickets } from './_hooks'

export default function CustomerAccountSupportHome() {
  const tickets = useCustomerSupportTickets()
  const format = useAccountFormat()
  const list = tickets.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <AccountPage
      title="Support"
      description="Messages you’ve sent us from the help chat, and our replies."
      actions={
        <button type="button" onClick={openSupportChat} className={storefront.secondaryButton}>
          <MessageCircle size={16} /> Ask a question
        </button>
      }
    >
      {tickets.isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-[76px] w-full rounded-card" />
          ))}
        </div>
      )}
      {tickets.isError && (
        <ErrorState
          message="We couldn’t load your support requests."
          onRetry={() => tickets.refetch()}
        />
      )}
      {tickets.data && list.length === 0 && (
        <EmptyState icon={<MessageCircle size={20} />} title="No support requests yet">
          <p>Questions you send us from the help chat show up here, with our replies.</p>
        </EmptyState>
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-3">
          {list.map((ticket) => (
            <li key={ticket.id}>
              <Link
                route="customers.account.support.show"
                routeParams={{ id: ticket.id }}
                className={cn(
                  storefront.card,
                  'flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-sf-primary-soft focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[14px] font-semibold">{ticket.reference}</span>
                    <SupportStatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-sf-muted">
                    Last message {format.dateTime(ticket.lastMessageAt)}
                  </p>
                </div>
                <ChevronRight size={18} className="flex-none text-sf-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tickets.hasNextPage && (
        <button
          type="button"
          onClick={() => tickets.fetchNextPage()}
          disabled={tickets.isFetchingNextPage}
          className={cn(
            storefront.iconButton,
            'h-10 w-full px-4 text-[14px] font-medium disabled:opacity-55 sm:w-fit sm:self-center'
          )}
        >
          {tickets.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      )}
    </AccountPage>
  )
}

CustomerAccountSupportHome.layout = [StorefrontLayout, AccountLayout]
