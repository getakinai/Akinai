import Logo from '~/components/logo'
import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import FlashToasts from '~/components/flash_toasts'
import { MaintenanceBanner } from '~/components/storefront'
import ThemeToggle from '~/components/theme_toggle'
import { buttonClasses } from '~/lib/styles'
import { useStorefrontSession } from '~/pages/_hooks'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useStorefrontSession()

  return (
    <>
      {session?.maintenance && <MaintenanceBanner />}
      <div className="relative">
        <header className="absolute inset-x-0 top-0 z-10 py-[22px]">
          <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-[30px] max-[720px]:px-4">
            <Logo size={28} />
            <div className="flex flex-wrap items-center justify-end gap-2 max-[480px]:[&_a]:px-2.5 max-[480px]:[&_a]:text-[13px]">
              <ThemeToggle />
              {isLoading ? null : session?.signedIn ? (
                <Link route="customers.account.home" className={buttonClasses({ size: 'sm' })}>
                  My account
                </Link>
              ) : (
                <>
                  <Link
                    route="customers.session.create"
                    className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                  >
                    Sign in
                  </Link>
                  <Link
                    route="customers.registration.create"
                    className={buttonClasses({ size: 'sm' })}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
      <FlashToasts />
    </>
  )
}
