import AdminLayout from '~/layouts/admin'

/**
 * Hero settings live on the built-in theme page. The home controller redirects
 * here away; this page exists only so the plugin page registry stays valid.
 */
export default function StorefrontHeroPage() {
  return null
}

StorefrontHeroPage.layout = [AdminLayout]
