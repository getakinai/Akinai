import { useMemo, useState, type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Dialog, Skeleton, Tabs, TabPanel } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { sanitizeHtml } from '~/lib/sanitize_html'
import { card, dataTable, inlineLink } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useDateFormat } from '~/hooks/use_date_format'
import { emailStatusMeta, emailTypeLabels } from './_format'
import { useAdminEmail, useResendAdminEmail } from './_hooks'
import { type AdminEmailDetail } from './_types'

type BodyTab = 'html' | 'text'

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="min-w-0 text-[13.5px] break-words text-ink">{children}</dd>
    </div>
  )
}

function EmailBody({ email }: { email: AdminEmailDetail }) {
  const [tab, setTab] = useState<BodyTab>(email.html ? 'html' : 'text')
  const html = useMemo(() => (email.html ? sanitizeHtml(email.html) : ''), [email.html])

  if (email.redacted) {
    return (
      <p className="text-[13.5px] text-muted">
        This email contained a one-time code, so its content was not stored.
      </p>
    )
  }
  if (!email.html && !email.text) {
    return <p className="text-[13.5px] text-muted">No content was stored for this email.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        idPrefix="email-body"
        label="Email content"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'html', label: 'HTML' },
          { id: 'text', label: 'Plain text' },
        ]}
      />
      <TabPanel idPrefix="email-body" id="html" active={tab === 'html'}>
        {email.html ? (
          <div className={`${dataTable.scroller} rounded-card border border-line bg-white`}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <p className="text-[13.5px] text-muted">This email has no HTML version.</p>
        )}
      </TabPanel>
      <TabPanel idPrefix="email-body" id="text" active={tab === 'text'}>
        {email.text ? (
          <pre className="max-w-full overflow-x-auto rounded-card border border-line bg-paper p-4 font-mono text-[12.5px] whitespace-pre-wrap text-ink-2">
            {email.text}
          </pre>
        ) : (
          <p className="text-[13.5px] text-muted">This email has no plain text version.</p>
        )}
      </TabPanel>
    </div>
  )
}

function ResendDialog({
  email,
  open,
  onClose,
}: {
  email: AdminEmailDetail
  open: boolean
  onClose: () => void
}) {
  const resend = useResendAdminEmail()

  const confirm = () => {
    resend.mutate(email.id, {
      onSuccess: () => {
        toast.success('Email queued to send again')
        onClose()
      },
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Could not resend the email'),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Resend this email?"
      description={`A copy goes to ${email.toAddresses.join(', ')} with the original subject and content.`}
      className="w-[min(480px,calc(100vw-24px))]"
    >
      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={resend.isPending} onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          loading={resend.isPending}
          loadingText="Sending…"
          onClick={confirm}
        >
          Resend email
        </FormButton>
      </div>
    </Dialog>
  )
}

export default function AdminEmailsShow({ id }: { id: string }) {
  const { formatDateTime } = useDateFormat()
  const { data: email, isLoading, isError } = useAdminEmail(id)
  const canResend = useCan('emails.create')
  const [resendOpen, setResendOpen] = useState(false)

  const eyebrow = (
    <Link route="admin.emails.home" className="inline-flex items-center gap-1 hover:text-ink">
      <ArrowLeft size={12} /> Emails
    </Link>
  )

  if (isLoading) {
    return (
      <Page eyebrow={eyebrow} title="Email">
        <Skeleton className="h-64 w-full" />
      </Page>
    )
  }
  if (isError || !email) {
    return (
      <Page eyebrow={eyebrow} title="Email">
        <p className="text-[14px] text-danger">Could not load this email.</p>
      </Page>
    )
  }

  const status = emailStatusMeta[email.status]
  const canResendThis = canResend && !email.redacted && Boolean(email.html || email.text)

  return (
    <Page
      eyebrow={eyebrow}
      title={email.subject || '(no subject)'}
      description={emailTypeLabels[email.type]}
      actions={
        canResendThis && (
          <FormButton type="button" variant="secondary" onClick={() => setResendOpen(true)}>
            <RotateCw size={15} /> Resend
          </FormButton>
        )
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className={`${card.base} order-2 lg:order-1`}>
          <div className={card.head}>
            <div>
              <span className={card.eyebrow}>Content</span>
              <h2 className={card.title}>Message</h2>
            </div>
          </div>
          <EmailBody email={email} />
        </section>

        <section className={`${card.base} order-1 lg:order-2`}>
          <div className={card.head}>
            <div>
              <span className={card.eyebrow}>Delivery</span>
              <h2 className={card.title}>Details</h2>
            </div>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </div>
          <dl className="divide-y divide-line">
            <MetaRow label="Created">{formatDateTime(email.createdAt)}</MetaRow>
            <MetaRow label="Sent">{email.sentAt ? formatDateTime(email.sentAt) : '—'}</MetaRow>
            <MetaRow label="From">{email.fromAddress ?? '—'}</MetaRow>
            <MetaRow label="To">{email.toAddresses.join(', ') || '—'}</MetaRow>
            {email.ccAddresses.length > 0 && (
              <MetaRow label="Cc">{email.ccAddresses.join(', ')}</MetaRow>
            )}
            {email.bccAddresses.length > 0 && (
              <MetaRow label="Bcc">{email.bccAddresses.join(', ')}</MetaRow>
            )}
            <MetaRow label="Type">{emailTypeLabels[email.type]}</MetaRow>
            {email.providerMessageId && (
              <MetaRow label="Message id">
                <span className={dataTable.mono}>{email.providerMessageId}</span>
              </MetaRow>
            )}
            {email.error && (
              <MetaRow label="Error">
                <span className="text-danger">{email.error}</span>
              </MetaRow>
            )}
            {email.orderId && (
              <MetaRow label="Order">
                <Link
                  route="admin.orders.show"
                  routeParams={{ id: email.orderId }}
                  className={inlineLink}
                >
                  View order
                </Link>
              </MetaRow>
            )}
            {email.customerId && (
              <MetaRow label="Customer">
                <Link
                  route="admin.customers.edit"
                  routeParams={{ id: email.customerId }}
                  className={inlineLink}
                >
                  View customer
                </Link>
              </MetaRow>
            )}
            {email.resentFromId && (
              <MetaRow label="Resent from">
                <Link
                  route="admin.emails.show"
                  routeParams={{ id: email.resentFromId }}
                  className={inlineLink}
                >
                  Original email
                </Link>
              </MetaRow>
            )}
          </dl>
        </section>
      </div>

      {canResendThis && (
        <ResendDialog email={email} open={resendOpen} onClose={() => setResendOpen(false)} />
      )}
    </Page>
  )
}

AdminEmailsShow.layout = [AdminLayout]
