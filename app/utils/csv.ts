import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import { CsvError, parse } from 'csv-parse/sync'
import { MAX_IMPORT_RECORD_SIZE, MAX_IMPORT_ROWS } from '#constants/csv_transfer'

/**
 * Quotes a CSV cell. Cells that a spreadsheet would run as a formula (`=`,
 * `+`, `-`, `@`, tab, CR) get a leading `'`, since values come from staff
 * input.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** A CSV document with a header row, CRLF line endings and a trailing newline. */
export function toCsv<Column extends string>(
  columns: readonly Column[],
  rows: Record<Column, string>[]
): string {
  const lines = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
  ]
  return `${lines.join('\r\n')}\r\n`
}

/** The staff user exporting or importing, for the security event. */
export function csvExportActor(ctx: HttpContext) {
  return { user: ctx.auth.use('web').getUserOrFail(), ipAddress: ctx.request.ip() }
}

/** Sends `csv` as a file download. */
export function sendCsv(response: HttpContext['response'], filename: string, csv: string): string {
  response.header('Content-Type', 'text/csv; charset=utf-8')
  response.header('Content-Disposition', `attachment; filename="${filename}"`)
  response.header('X-Content-Type-Options', 'nosniff')
  return csv
}

/** Rejects the uploaded file as a whole, reported on the `file` field. */
export function csvFileError(message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field: 'file', message, rule: 'csvImport' }])
}

export type CsvImportRecord<Column extends string> = {
  /** Line in the file where the row ends; the header is line 1. */
  line: number
  cells: Record<Column, string>
}

export type CsvImportError = {
  /** Line in the file where the row ends; the header is line 1. */
  row: number
  field: string | null
  message: string
}

/**
 * Rows of an import file as objects keyed by `columns`. The header must
 * match `columns` exactly (any other order is rejected, so a shifted column
 * can't land in the wrong field). `noun` names one row, e.g. `product`.
 */
export function parseCsvImport<Column extends string>(
  input: Buffer,
  columns: readonly Column[],
  noun: string
): CsvImportRecord<Column>[] {
  let records: { record: string[]; info: { lines: number } }[]
  try {
    records = parse(input, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      max_record_size: MAX_IMPORT_RECORD_SIZE,
      to: MAX_IMPORT_ROWS + 2,
      info: true,
    }) as unknown as { record: string[]; info: { lines: number } }[]
  } catch (error) {
    if (!(error instanceof CsvError)) throw error
    csvFileError(`The file is not a valid CSV: ${error.message}`)
  }

  const [header, ...rows] = records
  if (!header) csvFileError('The file is empty.')

  const found = header.record.map((column) => column.trim().toLowerCase())
  const matches =
    found.length === columns.length && columns.every((column, index) => found[index] === column)
  if (!matches) {
    csvFileError('The header row does not match the sample CSV. Download the sample and try again.')
  }
  if (rows.length === 0) csvFileError(`The file has no ${noun} rows.`)
  if (rows.length > MAX_IMPORT_ROWS) {
    csvFileError(`The file has more than ${MAX_IMPORT_ROWS} rows. Split it into smaller files.`)
  }

  return rows.map(({ record, info }) => ({
    line: info.lines,
    cells: Object.fromEntries(
      columns.map((column, position) => [column, record[position] ?? ''])
    ) as Record<Column, string>,
  }))
}

/**
 * The non-empty cells of a row, so empty cells read as omitted. Spreadsheets
 * save booleans as `TRUE` / `FALSE` and staff type `Active`; Vine booleans
 * and enums only accept lowercase, so `lowercaseColumns` are lowercased.
 */
export function presentCells(
  cells: Record<string, string>,
  lowercaseColumns: readonly string[] = []
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(cells)
      .filter(([, value]) => value !== '')
      .map(([column, value]) => [
        column,
        lowercaseColumns.includes(column) ? value.toLowerCase() : value,
      ])
  )
}

/** Row errors from a Vine validation error; any other error is rethrown. */
export function csvRowErrors(line: number, error: unknown): CsvImportError[] {
  if (!(error instanceof errors.E_VALIDATION_ERROR)) throw error
  return (error.messages as { field: string; message: string }[]).map(({ field, message }) => ({
    row: line,
    field,
    message,
  }))
}
