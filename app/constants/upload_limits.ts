export const MAX_IMAGE_UPLOAD_SIZE_MB = 5

export const MAX_IMAGE_UPLOAD_SIZE_BYTES = MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

/** Gallery photos per product, not counting the cover. */
export const MAX_GALLERY_IMAGES = 10

/** Drive folder for product photos. Submitted keys must live under it. */
export const PRODUCT_IMAGES_FOLDER = 'products'

/** Bank transfer screenshots customers send as proof of payment (private disk). */
export const PAYMENT_PROOF_FOLDER = 'payment-proofs'

export const PAYMENT_PROOF_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export const MAX_PAYMENT_PROOF_DETAILS_LENGTH = 1000

export const MAX_PAYMENT_PROOF_REJECTION_LENGTH = 500
