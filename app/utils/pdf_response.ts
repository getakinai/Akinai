import type { HttpContext } from '@adonisjs/core/http'

/**
 * Sends a generated PDF as a download. Never cached by shared caches.
 * A null document (not available for this order) is a 404.
 */
export function sendPdf(
  { response }: HttpContext,
  document: { filename: string; buffer: Buffer } | null
) {
  if (!document) return response.notFound({ errors: [{ message: 'Document not found' }] })
  const filename = document.filename.replace(/[^\w.-]/g, '_')
  response.header('Content-Type', 'application/pdf')
  response.header('Content-Disposition', `attachment; filename="${filename}"`)
  response.header('Cache-Control', 'private, no-store')
  response.header('X-Content-Type-Options', 'nosniff')
  return response.send(document.buffer)
}
