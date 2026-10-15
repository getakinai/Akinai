import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { FormButton, FormInput } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import { HttpError, type FieldErrors } from '~/lib/http'
import { card, cn } from '~/lib/styles'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { useAccountSecurity, useConfirmMfaSetup, useDisableMfa, useStartMfaSetup } from './_hooks'
import { MfaConfirmFormSchema, MfaDisableFormSchema, type MfaSetup, type MfaStatus } from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      toast.success('Recovery codes copied')
    } catch {
      toast.error('Could not copy. Select the codes and copy them by hand.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] text-pretty text-ink">
        2FA is on. Save these recovery codes somewhere safe. Each one signs you in once if you lose
        your phone. They won’t be shown again.
      </p>
      <ul className="grid grid-cols-1 gap-2 rounded-md border border-line bg-paper p-4 font-mono text-[13.5px] sm:grid-cols-2">
        {codes.map((code) => (
          <li key={code} className="select-all">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2.5">
        <FormButton type="button" variant="secondary" onClick={copy}>
          <Copy size={14} /> Copy codes
        </FormButton>
        <FormButton type="button" onClick={onDone}>
          I’ve saved them
        </FormButton>
      </div>
    </div>
  )
}

function SetupForm({
  setup,
  onCancel,
  onEnabled,
}: {
  setup: MfaSetup
  onCancel: () => void
  onEnabled: (codes: string[]) => void
}) {
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const confirm = useConfirmMfaSetup()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = MfaConfirmFormSchema.safeParse({ code })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    confirm.mutate(parsed.data, {
      onSuccess: onEnabled,
      onError: (error) => {
        if (error instanceof HttpError && error.status === 410) onCancel()
        handleMutationError(error, setErrors)
      },
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13.5px] text-ink">
        <li>Open an authenticator app (1Password, Google Authenticator, Authy…).</li>
        <li>Scan this QR code, or enter the setup key by hand.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <img
          src={setup.qrCodeDataUrl}
          alt="QR code for your authenticator app"
          width={180}
          height={180}
          className="size-[180px] shrink-0 rounded-md border border-line bg-white p-2"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[12.5px] text-muted">Setup key</span>
          <code className="font-mono text-[13.5px] break-all text-ink select-all">
            {setup.secret}
          </code>
        </div>
      </div>
      <div className="max-w-[320px]">
        <FormInput
          name="code"
          label="Code from your app"
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={errors.code}
        />
      </div>
      <div className="flex flex-wrap gap-2.5">
        <FormButton loading={confirm.isPending}>Turn on</FormButton>
        <FormButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </FormButton>
      </div>
    </form>
  )
}

function DisableForm({ status }: { status: MfaStatus }) {
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const disable = useDisableMfa()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = MfaDisableFormSchema.safeParse({ password, code })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    disable.mutate(parsed.data, {
      onSuccess: () => toast.success('2FA is off'),
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] text-pretty text-muted">
        On since {status.enabledAt ? dateFormat.format(new Date(status.enabledAt)) : 'recently'}.{' '}
        {status.recoveryCodesRemaining} recovery{' '}
        {status.recoveryCodesRemaining === 1 ? 'code' : 'codes'} left.
      </p>
      <form className="flex max-w-[480px] flex-col gap-4" onSubmit={onSubmit} noValidate>
        <p className="text-[13px] text-muted">
          To turn it off, confirm your password and a current code. Your other sessions will be
          signed out.
        </p>
        <FormInput
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <FormInput
          name="code"
          label="Code from your app or a recovery code"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={errors.code}
        />
        <div>
          <FormButton variant="danger" loading={disable.isPending}>
            Turn off 2FA
          </FormButton>
        </div>
      </form>
    </div>
  )
}

export default function MfaCard() {
  const { data: status, isLoading, isError, refetch } = useAccountSecurity()
  const startSetup = useStartMfaSetup()
  const [setup, setSetup] = useState<MfaSetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  function begin() {
    startSetup.mutate(undefined, {
      onSuccess: setSetup,
      onError: (error) => handleMutationError(error, () => {}),
    })
  }

  let body
  if (recoveryCodes) {
    body = <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />
  } else if (isLoading) {
    body = (
      <div className="flex flex-col gap-2">
        <Skeleton className="w-2/3" />
        <Skeleton className="w-1/3" />
      </div>
    )
  } else if (isError || !status) {
    body = (
      <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-muted">
        <span>Could not load your security settings.</span>
        <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
          Try again
        </FormButton>
      </div>
    )
  } else if (status.enabled) {
    body = <DisableForm status={status} />
  } else if (setup) {
    body = (
      <SetupForm
        setup={setup}
        onCancel={() => setSetup(null)}
        onEnabled={(codes) => {
          setSetup(null)
          setRecoveryCodes(codes)
        }}
      />
    )
  } else {
    body = (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[13.5px] text-pretty text-muted">
          Ask for a code from an authenticator app each time you sign in, so a stolen password alone
          can’t open the back office.
        </p>
        <FormButton type="button" loading={startSetup.isPending} onClick={begin}>
          Set up 2FA
        </FormButton>
      </div>
    )
  }

  return (
    <section id="mfa" className={cn(card.base, 'scroll-mt-20')}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Sign-in</span>
          <h2 className={card.title}>Two-factor authentication (2FA)</h2>
        </div>
        {status && !recoveryCodes && (
          <Badge tone={status.enabled ? 'success' : 'neutral'} dot>
            {status.enabled ? 'On' : 'Off'}
          </Badge>
        )}
      </header>
      {body}
    </section>
  )
}
