import { z } from 'zod'

export type FieldErrors = Record<string, string>

/**
 * Error thrown for any non-2xx response. `fieldErrors` is populated from
 * VineJS 422 responses; `message` comes from `{ error }` or Bouncer's
 * `{ errors: [{ message }] }` payloads.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: FieldErrors = {},
    public code?: string
  ) {
    super(message)
  }
}

const vineErrorsSchema = z.object({
  errors: z.array(z.object({ field: z.string(), message: z.string() })),
})

const errorMessageSchema = z.object({ error: z.string(), code: z.string().optional() })

const errorsMessageSchema = z.object({ errors: z.array(z.object({ message: z.string() })).min(1) })

export function readXsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

type RequestOptions<TSchema extends z.ZodType> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  schema: TSchema
  signal?: AbortSignal
  headers?: Record<string, string>
  /** Lets the request finish after the page unloads (small payloads only). */
  keepalive?: boolean
}

/**
 * JSON fetch helper for same-origin API routes. Sends the Shield XSRF
 * token on mutations and validates the response with the given Zod schema.
 * A `FormData` body is sent as multipart (the browser sets the boundary).
 */
export async function http<TSchema extends z.ZodType>(
  url: string,
  {
    method = 'GET',
    body,
    schema,
    signal,
    headers: extraHeaders,
    keepalive,
  }: RequestOptions<TSchema>
): Promise<z.infer<TSchema>> {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers: Record<string, string> = { ...extraHeaders, Accept: 'application/json' }
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  const xsrfToken = readXsrfToken()
  if (method !== 'GET' && xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
    keepalive,
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw httpErrorFrom(response.status, payload)

  return schema.parse(payload)
}

function httpErrorFrom(status: number, payload: unknown): HttpError {
  const vineErrors = vineErrorsSchema.safeParse(payload)
  if (vineErrors.success) {
    const fieldErrors: FieldErrors = {}
    for (const { field, message } of vineErrors.data.errors) {
      fieldErrors[field] ??= message
    }
    return new HttpError('Please fix the highlighted fields', status, fieldErrors)
  }

  const errorMessage = errorMessageSchema.safeParse(payload)
  if (errorMessage.success) {
    return new HttpError(errorMessage.data.error, status, {}, errorMessage.data.code)
  }

  const errorsMessage = errorsMessageSchema.safeParse(payload)
  return new HttpError(
    errorsMessage.success ? errorsMessage.data.errors[0].message : 'Something went wrong',
    status
  )
}

/**
 * Downloads a same-origin file (GET) and saves it under the server's
 * `Content-Disposition` filename, or `fallbackName`. Error responses throw
 * `HttpError` like `http()`.
 */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw httpErrorFrom(response.status, payload)
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackName
  const objectUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  // Revoking in the same tick can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export const redirectResponseSchema = z.object({
  data: z.object({ redirectTo: z.string() }),
})
