export const LOGO_FOLDER = 'branding/logos'

export const FAVICON_FOLDER = 'branding/favicons'

export const MAX_BRAND_NAME_LENGTH = 80

export const MAX_LOGO_UPLOAD_SIZE_MB = 2

export const MAX_FAVICON_UPLOAD_SIZE_MB = 5

/** No SVG: it can carry scripts when served inline from our origin. */
export const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export const FAVICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

/** Smallest accepted side, in pixels, of the square favicon source. */
export const FAVICON_MIN_SIZE = 512

export type FaviconFile = { name: string; size: number }

/** Every icon generated from the uploaded favicon. Mirrors `public/favicons`. */
export const FAVICON_PNG_FILES: FaviconFile[] = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-icon-57x57.png', size: 57 },
  { name: 'apple-icon-60x60.png', size: 60 },
  { name: 'apple-icon-72x72.png', size: 72 },
  { name: 'apple-icon-76x76.png', size: 76 },
  { name: 'apple-icon-114x114.png', size: 114 },
  { name: 'apple-icon-120x120.png', size: 120 },
  { name: 'apple-icon-144x144.png', size: 144 },
  { name: 'apple-icon-152x152.png', size: 152 },
  { name: 'apple-icon-180x180.png', size: 180 },
  { name: 'apple-icon.png', size: 180 },
  { name: 'apple-icon-precomposed.png', size: 180 },
  { name: 'android-icon-36x36.png', size: 36 },
  { name: 'android-icon-48x48.png', size: 48 },
  { name: 'android-icon-72x72.png', size: 72 },
  { name: 'android-icon-96x96.png', size: 96 },
  { name: 'android-icon-144x144.png', size: 144 },
  { name: 'android-icon-192x192.png', size: 192 },
  { name: 'ms-icon-70x70.png', size: 70 },
  { name: 'ms-icon-144x144.png', size: 144 },
  { name: 'ms-icon-150x150.png', size: 150 },
  { name: 'ms-icon-310x310.png', size: 310 },
]

export const FAVICON_ICO_FILE = 'favicon.ico'

/** PNG embedded in `favicon.ico`. */
export const FAVICON_ICO_SIZE = 32

export const FAVICON_FILE_NAMES = [...FAVICON_PNG_FILES.map(({ name }) => name), FAVICON_ICO_FILE]

/** Shown as the favicon thumbnail in the back office. */
export const FAVICON_PREVIEW_FILE = 'apple-icon-180x180.png'

export const MANIFEST_ICON_FILES = FAVICON_PNG_FILES.filter(({ name }) =>
  name.startsWith('android-icon-')
)
