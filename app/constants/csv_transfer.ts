/** Most data rows one import file may hold. */
export const MAX_IMPORT_ROWS = 1000

/** Most rows one export may hold. */
export const MAX_EXPORT_ROWS = 10_000

export const MAX_IMPORT_SIZE_MB = 2

/** Longest single CSV record (bytes), so one huge cell can't exhaust memory. */
export const MAX_IMPORT_RECORD_SIZE = 64 * 1024

/** Errors returned to the browser; the rest are counted, not listed. */
export const MAX_IMPORT_ERRORS = 200
