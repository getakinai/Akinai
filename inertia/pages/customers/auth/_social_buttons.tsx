import { type ReactNode } from 'react'
import { Mail } from 'lucide-react'
import { GoogleIcon, MicrosoftIcon } from '~/components/ui'
import { FormButton } from '~/components/form'
import { urlFor } from '~/client'
import { buttonClasses } from '~/lib/styles'

type SocialButtonsProps = {
  onEmail: () => void
  /** `signup` lets Google/Microsoft create a new account; `login` needs an existing one. */
  intent: 'login' | 'signup'
}

function ProviderLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a href={href} className={buttonClasses({ block: true })}>
      {icon}
      {label}
    </a>
  )
}

export default function SocialButtons({ onEmail, intent }: SocialButtonsProps) {
  const providerUrl = (provider: 'google' | 'microsoft') =>
    urlFor('customers.social.redirect', { provider, intent })

  return (
    <div className="mt-[22px] flex flex-col gap-2.5">
      <ProviderLink
        href={providerUrl('google')}
        icon={<GoogleIcon />}
        label="Continue with Google"
      />
      <ProviderLink
        href={providerUrl('microsoft')}
        icon={<MicrosoftIcon />}
        label="Continue with Outlook"
      />
      <FormButton type="button" block onClick={onEmail}>
        <Mail size={18} aria-hidden="true" />
        Continue with email
      </FormButton>
    </div>
  )
}
