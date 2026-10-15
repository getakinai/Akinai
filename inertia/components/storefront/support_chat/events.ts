export const SUPPORT_CHAT_OPEN_EVENT = 'support-chat:open'

/** Opens the storefront help chat from anywhere on the page. */
export function openSupportChat() {
  window.dispatchEvent(new Event(SUPPORT_CHAT_OPEN_EVENT))
}
