/**
 * User-facing 429 message. `availableInSeconds` comes from the limiter response.
 */
export function tooManyAttemptsMessage(availableInSeconds: number): string {
  const minutes = Math.ceil(availableInSeconds / 60)
  if (minutes <= 1) return 'Too many attempts. Please try again in a minute.'
  return `Too many attempts. Please try again in ${minutes} minutes.`
}
