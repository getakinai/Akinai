import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { FormButton, FormFileInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { csvPreview, dataTable, inlineLink } from '~/lib/styles'
import { readCsvPreview, type CsvPreview, type CsvPreviewRow } from './read_csv_preview'

const PREVIEW_LIMIT = 100

export type CsvImportOutcome = {
  created: number
  updated: number
  skipped: number
  errorCount: number
  errors: { row: number; field: string | null; message: string }[]
}

type CsvImportDialogProps<Column extends string> = {
  title: string
  description: string
  /** One record, then many: `['vendor', 'vendors']`. */
  noun: readonly [string, string]
  sampleHref: string
  columns: readonly Column[]
  maxRows: number
  maxBytes: number
  hint: string
  /** Rows sharing this column's value are one record (e.g. product variants). */
  groupBy?: Column
  /** Columns of the default preview table; the first four when omitted. */
  previewColumns?: readonly Column[]
  /** Replaces the default preview table. */
  renderPreview?: (rows: CsvPreviewRow<Column>[], records: number) => ReactNode
  pending: boolean
  /** Shown in place of the preview while the import runs. */
  progress?: ReactNode
  onImport: (file: File) => Promise<CsvImportOutcome>
  onClose: () => void
}

const count = (value: number, [one, many]: readonly [string, string]) =>
  `${value} ${value === 1 ? one : many}`

function importSummary({ created, updated }: CsvImportOutcome, noun: readonly [string, string]) {
  if (updated === 0) return `Imported ${count(created, noun)}`
  return created === 0
    ? `Updated ${count(updated, noun)}`
    : `Imported ${count(created, noun)}, updated ${updated}`
}

/**
 * Uploads a CSV in the sample's format, previews its rows first and lists
 * the rows the server rejected.
 */
export default function CsvImportDialog<Column extends string>({
  title,
  description,
  noun,
  sampleHref,
  columns,
  maxRows,
  maxBytes,
  hint,
  groupBy,
  previewColumns,
  renderPreview,
  pending,
  progress,
  onImport,
  onClose,
}: CsvImportDialogProps<Column>) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview<Column> | null>(null)
  const [reading, setReading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [result, setResult] = useState<CsvImportOutcome | null>(null)
  const readToken = useRef(0)
  const maxMegabytes = Math.round(maxBytes / (1024 * 1024))

  function reset(error?: string) {
    readToken.current++
    setFile(null)
    setPreview(null)
    setReading(false)
    setErrors(error ? { file: error } : {})
  }

  async function onSelect(next: File | null) {
    setResult(null)
    if (!next) return reset()
    if (!next.name.toLowerCase().endsWith('.csv')) return reset('Choose a .csv file.')
    if (next.size > maxBytes) return reset(`The file must be ${maxMegabytes} MB or smaller.`)

    const token = ++readToken.current
    setErrors({})
    setFile(next)
    setPreview(null)
    setReading(true)
    try {
      const read = await readCsvPreview(next, { columns, maxRows, noun: noun[0], groupBy })
      if (token !== readToken.current) return
      setPreview(read)
      if (!read.ok) setErrors({ file: read.error })
    } catch {
      if (token !== readToken.current) return
      setErrors({ file: 'Could not read the file. Choose it again.' })
    } finally {
      if (token === readToken.current) setReading(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) return setErrors({ file: 'Choose a CSV file to import.' })
    if (!preview?.ok) return

    setErrors({})
    try {
      const imported = await onImport(file)
      if (imported.created > 0 || imported.updated > 0) toast.success(importSummary(imported, noun))
      if (imported.errorCount === 0) return onClose()

      setResult(imported)
      setFile(null)
      setPreview(null)
    } catch (error) {
      handleMutationError(error, setErrors)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      className="max-w-[760px]!"
      title={title}
      description={description}
    >
      <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <a
          href={sampleHref}
          download
          className={`inline-flex w-fit items-center gap-1.5 text-[13px] ${inlineLink}`}
        >
          <Download size={14} /> Download sample CSV
        </a>

        <FormFileInput
          name={`${noun[1].replaceAll(' ', '-')}-import-file`}
          label="CSV file"
          accept=".csv,text/csv"
          file={file}
          hint={hint}
          disabled={pending}
          error={errors.file}
          onSelect={(next) => void onSelect(next)}
        />

        {reading && (
          <p className="text-[13px] text-muted" role="status">
            Reading file…
          </p>
        )}
        {pending && progress}
        {preview?.ok && !(pending && progress) && (
          <div className="flex min-w-0 flex-col gap-2">
            {renderPreview ? (
              renderPreview(preview.rows, preview.records)
            ) : (
              <>
                <p className="text-[13px] text-ink">{count(preview.records, noun)}</p>
                <PreviewTable rows={preview.rows} columns={previewColumns ?? columns.slice(0, 4)} />
              </>
            )}
            {preview.rows.length > PREVIEW_LIMIT && (
              <p className="text-[12.5px] text-muted">
                Showing the first {PREVIEW_LIMIT} of {preview.rows.length} rows. All rows will be
                imported.
              </p>
            )}
          </div>
        )}

        {result && <ImportResult result={result} noun={noun} />}

        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            {result ? 'Done' : 'Cancel'}
          </FormButton>
          <FormButton
            size="sm"
            loading={pending}
            loadingText="Importing…"
            disabled={reading || (file !== null && !preview?.ok)}
          >
            {preview?.ok ? `Import ${count(preview.records, noun)}` : 'Import'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}

/** The first rows of the file, for custom previews to share the limit. */
export function previewRows<Row>(rows: Row[]): Row[] {
  return rows.slice(0, PREVIEW_LIMIT)
}

function PreviewTable<Column extends string>({
  rows,
  columns,
}: {
  rows: CsvPreviewRow<Column>[]
  columns: readonly Column[]
}) {
  return (
    <div className={csvPreview.wrapper}>
      <table className={csvPreview.table}>
        <thead>
          <tr>
            <th className={csvPreview.th}>Row</th>
            {columns.map((column) => (
              <th key={column} className={csvPreview.th}>
                {column.replaceAll('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows(rows).map((row) => (
            <tr key={row.line}>
              <td className={`${csvPreview.td} ${dataTable.mono}`}>{row.line}</td>
              {columns.map((column) => (
                <td key={column} className={`${csvPreview.td} max-w-[220px] truncate`}>
                  {row[column] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ImportResult({
  result,
  noun,
}: {
  result: CsvImportOutcome
  noun: readonly [string, string]
}) {
  const hidden = result.errorCount - result.errors.length

  return (
    <div className="flex flex-col gap-2.5" role="status">
      <p className="text-[13.5px] text-ink">
        {count(result.created, noun)} created
        {result.updated > 0 && ` · ${result.updated} updated`}
        {result.skipped > 0 && (
          <span className="text-danger"> · {count(result.skipped, noun)} skipped</span>
        )}
      </p>
      {result.errors.length > 0 && (
        <ul className="flex max-h-60 flex-col divide-y divide-line overflow-y-auto rounded-lg border border-line-2 text-[13px]">
          {result.errors.map((error, index) => (
            <li key={index} className="flex min-w-0 flex-col gap-0.5 px-3 py-2">
              <span className="font-mono text-[11.5px] text-muted">
                Row {error.row}
                {error.field ? ` · ${error.field}` : ''}
              </span>
              <span className="break-words text-ink-2">{error.message}</span>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <p className="text-[12.5px] text-muted">
          …and {count(hidden, ['more error', 'more errors'])}. Fix the rows above and import again.
        </p>
      )}
    </div>
  )
}
