import type { HttpContext } from '@adonisjs/core/http'

/**
 * Sends a private image read from Drive. The Content-Type comes from the
 * stored extension; the response is never cached by shared caches.
 * Missing images are a 404.
 */
export function sendPrivateImage(
  { response }: HttpContext,
  image: { contents: Uint8Array; contentType: string } | null
) {
  if (!image) return response.notFound({ errors: [{ message: 'Image not found' }] })
  response.header('Content-Type', image.contentType)
  response.header('Cache-Control', 'private, no-store')
  response.header('Content-Disposition', 'inline')
  response.header('X-Content-Type-Options', 'nosniff')
  return response.send(Buffer.from(image.contents))
}
