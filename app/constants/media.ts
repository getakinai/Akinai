/** Drive folder for images uploaded straight to the media gallery. */
export const MEDIA_FOLDER = 'media'

/** Top-level Drive folders the gallery can be filtered by. */
export const MEDIA_FOLDERS = [
  'products',
  'collections',
  'vendors',
  'storefront',
  'branding',
  MEDIA_FOLDER,
] as const

/** Files accepted in one gallery upload request. */
export const MAX_MEDIA_FILES_PER_UPLOAD = 20
