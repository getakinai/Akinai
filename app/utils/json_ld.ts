const UNSAFE_CHARACTERS: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * JSON for a `<script type="application/ld+json">` body. Escapes the
 * characters that could close the script tag or break the parser, so the
 * result is safe to print unescaped in a template.
 */
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => UNSAFE_CHARACTERS[character]
  )
}
