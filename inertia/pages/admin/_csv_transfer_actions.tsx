import { useState, type ComponentProps, type ReactNode } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { CsvImportDialog } from '~/components/csv_import'
import { FormButton } from '~/components/form'
import { HttpError } from '~/lib/http'
import { useCan } from './_hooks'
import { CSV_IMPORT_MAX_BYTES, CSV_IMPORT_MAX_ROWS, type CsvImportResult } from './_types'

type CsvTransferActionsProps<TQuery> = {
  /** Permission prefix, e.g. `vendors` for `vendors.import` / `vendors.export`. */
  resource: string
  exportMutation: UseMutationResult<void, Error, TQuery>
  /** The list's current filters; the export follows them. */
  exportQuery: TQuery
  renderImportDialog: (onClose: () => void) => ReactNode
}

/**
 * Export and Import buttons for a list page's header, each shown only with
 * its permission. Import opens the dialog from `renderImportDialog`.
 */
export default function CsvTransferActions<TQuery>({
  resource,
  exportMutation,
  exportQuery,
  renderImportDialog,
}: CsvTransferActionsProps<TQuery>) {
  const canExport = useCan(`${resource}.export`)
  const canImport = useCan(`${resource}.import`)
  const [importing, setImporting] = useState(false)

  return (
    <>
      {canExport && (
        <FormButton
          type="button"
          variant="secondary"
          size="sm"
          loading={exportMutation.isPending}
          onClick={() =>
            exportMutation.mutate(exportQuery, {
              onError: (error) =>
                toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
            })
          }
        >
          <Download size={15} /> Export
        </FormButton>
      )}
      {canImport && (
        <FormButton type="button" variant="secondary" size="sm" onClick={() => setImporting(true)}>
          <Upload size={15} /> Import
        </FormButton>
      )}
      {importing && renderImportDialog(() => setImporting(false))}
    </>
  )
}

type AdminCsvImportDialogProps<Column extends string> = Omit<
  ComponentProps<typeof CsvImportDialog<Column>>,
  'title' | 'maxRows' | 'maxBytes' | 'pending' | 'onImport'
> & {
  mutation: UseMutationResult<CsvImportResult, Error, File>
}

/** `CsvImportDialog` with the back-office import limits and an import mutation. */
export function AdminCsvImportDialog<Column extends string>({
  mutation,
  ...props
}: AdminCsvImportDialogProps<Column>) {
  return (
    <CsvImportDialog
      {...props}
      title={`Import ${props.noun[1]}`}
      maxRows={CSV_IMPORT_MAX_ROWS}
      maxBytes={CSV_IMPORT_MAX_BYTES}
      pending={mutation.isPending}
      onImport={mutation.mutateAsync}
    />
  )
}

/** Whether the user sees any of the CSV buttons for `resource`. */
export function useCanCsvTransfer(resource: string) {
  const canExport = useCan(`${resource}.export`)
  const canImport = useCan(`${resource}.import`)
  return canExport || canImport
}
