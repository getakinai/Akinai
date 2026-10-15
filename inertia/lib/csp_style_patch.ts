/**
 * Libraries such as Sonner inject a `<style>` tag at import time without a
 * nonce. Patch `createElement` once so runtime stylesheets match our CSP.
 */
const nonce =
  document.querySelector<HTMLMetaElement>('meta[property=csp-nonce]')?.nonce || undefined

if (nonce && !('__cspStylePatch' in document)) {
  Object.defineProperty(document, '__cspStylePatch', { value: true })

  const createElement = document.createElement.bind(document)
  document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
    const element = createElement(tagName, options)
    if (tagName.toLowerCase() === 'style') {
      element.setAttribute('nonce', nonce)
    }
    return element
  }) as typeof document.createElement
}
