import { useEffect, useState } from 'react'
import { type UseMutationResult } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { HttpError } from '~/lib/http'

const INITIAL_COOLDOWN_SECONDS = 60

type ResendCodeButtonProps = {
  resend: UseMutationResult<{ data: { cooldownSeconds: number } }, Error, void>
}

/**
 * "Resend code" with a countdown. Starts cooling down on mount because a
 * code was just sent.
 */
export default function ResendCodeButton({ resend }: ResendCodeButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COOLDOWN_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  function onResend() {
    resend.mutate(undefined, {
      onSuccess: ({ data }) => {
        toast.success('We sent you a new code')
        setSecondsLeft(data.cooldownSeconds)
      },
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
    })
  }

  return (
    <FormButton
      type="button"
      variant="ghost"
      block
      onClick={onResend}
      disabled={secondsLeft > 0}
      loading={resend.isPending}
      loadingText="Sending…"
    >
      {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
    </FormButton>
  )
}
