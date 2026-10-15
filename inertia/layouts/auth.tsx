import Logo from '~/components/logo'
import { type ReactNode } from 'react'
import FlashToasts from '~/components/flash_toasts'
import RecaptchaNotice from '~/components/recaptcha_notice'
import ThemeToggle from '~/components/theme_toggle'
import { usePreloadRecaptcha } from '~/hooks/use_preload_recaptcha'
import { APP_NAME } from '~/lib/brand'

type AuthLayoutProps = {
  children: ReactNode
  logo?: ReactNode
  tagline?: ReactNode
  banner?: ReactNode
}

export default function AuthLayout({
  children,
  logo = <Logo size={28} />,
  tagline = `${APP_NAME}. Shop, send and track every order.`,
  banner,
}: AuthLayoutProps) {
  usePreloadRecaptcha()

  return (
    <div className="flex min-h-screen flex-col">
      {banner}
      <div className="grid flex-1 grid-cols-[1.04fr_1fr] max-[880px]:grid-cols-1">
        <div className="relative flex flex-col bg-card px-9 py-[30px]">
          <div className="flex min-w-0">{logo}</div>
          <div className="m-auto w-full max-w-[344px] py-5">
            {children}
            <RecaptchaNotice className="mt-4 text-subtle" />
          </div>
          <div className="h-5" />
        </div>

        <aside className="relative flex flex-col justify-between border-l border-line bg-paper p-11 max-[880px]:hidden">
          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>

          <p className="max-w-[22ch] font-serif text-[25px] leading-[1.3] font-normal tracking-[0.2px] text-balance">
            {tagline}
          </p>
          <div />
        </aside>
      </div>
      <FlashToasts />
    </div>
  )
}
