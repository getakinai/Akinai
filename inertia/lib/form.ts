import { toast } from 'sonner'
import { type z } from 'zod'
import { HttpError, type FieldErrors } from './http'

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    fieldErrors[field] ??= issue.message
  }
  return fieldErrors
}

/**
 * Maps a failed mutation to field errors; non-field errors become a toast.
 */
export function handleMutationError(error: unknown, setErrors: (errors: FieldErrors) => void) {
  if (error instanceof HttpError) {
    setErrors(error.fieldErrors)
    if (Object.keys(error.fieldErrors).length === 0) toast.error(error.message)
    return
  }
  toast.error('Something went wrong')
}

export const emptyToNull = (value: string) => (value.trim() === '' ? null : value)
