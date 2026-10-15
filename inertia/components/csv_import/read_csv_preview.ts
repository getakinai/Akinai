export type CsvPreviewRow<Column extends string> = Record<Column, string> & { line: number }

export type CsvPreview<Column extends string> =
  { ok: true; rows: CsvPreviewRow<Column>[]; records: number } | { ok: false; error: string }

export type CsvPreviewOptions<Column extends string> = {
  columns: readonly Column[]
  maxRows: number
  /** One row, e.g. `product`. */
  noun: string
  /** Rows sharing this column's value (ignoring case) are one record. */
  groupBy?: Column
}

/**
 * Reads the chosen CSV in the browser with the same parser and header rule
 * as the server, so staff can check the rows before uploading. The server
 * still validates everything.
 */
export async function readCsvPreview<Column extends string>(
  file: File,
  { columns, maxRows, noun, groupBy }: CsvPreviewOptions<Column>
): Promise<CsvPreview<Column>> {
  const { parse, CsvError } = await import('csv-parse/browser/esm/sync')

  let records: { record: string[]; info: { lines: number } }[]
  try {
    records = parse(await file.text(), {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      to: maxRows + 2,
      info: true,
    }) as unknown as { record: string[]; info: { lines: number } }[]
  } catch (error) {
    if (!(error instanceof CsvError)) throw error
    return { ok: false, error: `The file is not a valid CSV: ${error.message}` }
  }

  const [header, ...rest] = records
  if (!header) return { ok: false, error: 'The file is empty.' }

  const found = header.record.map((column) => column.trim().toLowerCase())
  const matches =
    found.length === columns.length && columns.every((column, index) => found[index] === column)
  if (!matches) {
    return {
      ok: false,
      error: 'The header row does not match the sample CSV. Download the sample and try again.',
    }
  }
  if (rest.length === 0) return { ok: false, error: `The file has no ${noun} rows.` }
  if (rest.length > maxRows) {
    return {
      ok: false,
      error: `The file has more than ${maxRows} rows. Split it into smaller files.`,
    }
  }

  const rows = rest.map(({ record, info }) => {
    const cells = Object.fromEntries(
      columns.map((column, position) => [column, record[position] ?? ''])
    ) as Record<Column, string>
    return { ...cells, line: info.lines }
  })
  const count = groupBy ? new Set(rows.map((row) => row[groupBy].toLowerCase())).size : rows.length

  return { ok: true, rows, records: count }
}
