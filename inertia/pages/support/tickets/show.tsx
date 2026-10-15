import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { LifeBuoy } from 'lucide-react'
import RecaptchaNotice from '~/components/recaptcha_notice'
import {
  SupportMessages,
  SupportReplyBox,
  SupportStatusBadge,
} from '~/components/storefront/support_thread'
import { Skeleton } from '~/components/ui'
import { usePreloadRecaptcha } from '~/hooks/use_preload_recaptcha'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import { usePublicSupportThread, useReplyPublicSupportThread } from '../_hooks'

/** A support conversation opened from the private link in our email. */
export default function SupportTicketShow({ token }: { token: string }) {
  usePreloadRecaptcha()
  const { data: thread, isLoading, isError } = usePublicSupportThread(token)
  const reply = useReplyPublicSupportThread(token)

  return (
    <>
      <Head title={thread ? `Your request ${thread.ticket.reference}` : 'Your support request'}>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <div className={cn(storefront.container, 'flex max-w-[760px] flex-col gap-5 py-6 sm:py-10')}>
        {isLoading && <Skeleton className="h-72 w-full rounded-card" />}

        {isError && (
          <div className={cn(storefront.card, 'flex flex-col items-center gap-2 p-8 text-center')}>
            <LifeBuoy size={22} className="text-sf-muted" />
            <h1 className="text-[18px] font-semibold">This link has expired or isn’t valid</h1>
            <p className="max-w-[46ch] text-[14px] text-pretty text-sf-muted">
              Links in our support emails work for 30 days after our last reply. Open the help chat
              to send us a new message, or{' '}
              <Link route="storefront.help.home" className="text-sf-primary underline">
                browse the help centre
              </Link>
              .
            </p>
          </div>
        )}

        {thread && (
          <>
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-mono text-[12.5px] text-sf-muted">
                  {thread.ticket.reference}
                </p>
                <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[26px]">
                  Your support request
                </h1>
                <p className="mt-1 text-[14px] text-sf-muted">
                  Keep this page private: anyone with the link can read and reply.
                </p>
              </div>
              <SupportStatusBadge status={thread.ticket.status} />
            </header>

            <section className={cn(storefront.card, 'p-4 sm:p-5')}>
              <SupportMessages messages={thread.messages} />
            </section>

            <SupportReplyBox
              closed={thread.ticket.status === 'closed'}
              isPending={reply.isPending}
              onSend={(payload, callbacks) => reply.mutate(payload, callbacks)}
              footer={<RecaptchaNotice />}
            />
          </>
        )}
      </div>
    </>
  )
}

SupportTicketShow.layout = [StorefrontLayout]
