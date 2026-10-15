import { type ReactNode } from 'react'
import { MaintenanceBanner, StoreLogo } from '~/components/storefront'
import { APP_NAME } from '~/lib/brand'
import { useStoreSettings, useStorefrontSession, useStorefrontTheme } from '~/pages/_hooks'
import AuthLayout from './auth'

/**
 * Auth shell for storefront customers, branded with the store's uploaded
 * logo. Staff auth pages keep `AuthLayout` so they don't depend on
 * storefront endpoints, which serve the maintenance page while the store is down.
 */
export default function CustomerAuthLayout({ children }: { children: ReactNode }) {
  const { data: theme, isLoading: themeLoading } = useStorefrontTheme()
  const { data: settings } = useStoreSettings()
  const { data: session } = useStorefrontSession()
  const brandName = theme?.brandName || settings?.storeName || APP_NAME

  return (
    <AuthLayout
      tagline={themeLoading ? null : theme?.footerTagline || `Shop online with ${brandName}.`}
      banner={session?.maintenance ? <MaintenanceBanner /> : null}
      logo={
        <StoreLogo
          logoUrl={theme?.logoUrl}
          storeName={brandName}
          size={28}
          loading={themeLoading}
        />
      }
    >
      {children}
    </AuthLayout>
  )
}
