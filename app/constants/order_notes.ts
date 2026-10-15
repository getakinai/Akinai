export const ORDER_NOTE_VISIBILITIES = ['internal', 'customer'] as const

export type OrderNoteVisibility = (typeof ORDER_NOTE_VISIBILITIES)[number]

/** Most customer replies one note can hold; note lists load every reply. */
export const MAX_ORDER_NOTE_REPLIES = 50
