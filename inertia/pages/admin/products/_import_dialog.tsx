import { useState } from 'react'
import { urlFor } from '~/client'
import { CsvImportDialog, previewRows, type CsvPreviewRow } from '~/components/csv_import'
import { ProgressBar } from '~/components/ui'
import { csvPreview, dataTable } from '~/lib/styles'
import { useImportAdminProducts, useProductImportProgress } from './_hooks'
import { CSV_IMPORT_MAX_BYTES, CSV_IMPORT_MAX_ROWS } from '../_types'
import { PRODUCT_IMPORT_COLUMNS, type ProductImportProgress } from './_types'

type ProductImportPreviewRow = CsvPreviewRow<(typeof PRODUCT_IMPORT_COLUMNS)[number]>

type ImportDialogProps = {
  onClose: () => void
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

/**
 * Uploads a CSV of products (one row per variant) and shows which rows
 * were rejected.
 */
export default function ImportDialog({ onClose }: ImportDialogProps) {
  const importProducts = useImportAdminProducts()
  const [importId, setImportId] = useState<string | null>(null)
  const progress = useProductImportProgress(importId, true)

  function startImport(file: File) {
    const id = crypto.randomUUID()
    setImportId(id)
    return importProducts.mutateAsync({ file, importId: id })
  }

  return (
    <CsvImportDialog
      title="Import products"
      description="Upload a CSV with one row per variant. Rows with the same handle become one product. Existing handles are updated; empty cells keep the current value. Image URLs (separated by |, first one is the cover) are copied to our image storage."
      noun={['product', 'products']}
      sampleHref={urlFor('admin.products.import.sample')}
      columns={PRODUCT_IMPORT_COLUMNS}
      maxRows={CSV_IMPORT_MAX_ROWS}
      maxBytes={CSV_IMPORT_MAX_BYTES}
      hint="Up to 1,000 rows and 2 MB. Vendors, product types and options must already exist."
      groupBy="handle"
      renderPreview={(rows, products) => <ImportPreview rows={rows} products={products} />}
      pending={importProducts.isPending}
      progress={<ProgressBar {...progressDisplay(progress)} />}
      onImport={startImport}
      onClose={onClose}
    />
  )
}

/** Reading rows is the first 5%, copying images up to 95%, saving the rest. */
function progressDisplay(progress: ProductImportProgress | null) {
  if (!progress) return { label: 'Uploading file…', percent: null }
  const share = progress.total > 0 ? progress.done / progress.total : 1
  switch (progress.phase) {
    case 'reading':
      return { label: `Checking ${plural(progress.total, 'row')}…`, percent: 5 * share }
    case 'images':
      return {
        label: `Copying images ${progress.done} of ${progress.total}…`,
        percent: 5 + 90 * share,
      }
    case 'saving':
      return { label: 'Saving products…', percent: 95 }
  }
}

function variantLabel(row: ProductImportPreviewRow): string {
  const values = [row.option1_value, row.option2_value, row.option3_value].filter(Boolean)
  return values.length > 0 ? values.join(' / ') : 'Default'
}

function stockLabel(row: ProductImportPreviewRow): string {
  if (row.track_inventory.toLowerCase() !== 'true') return 'Not tracked'
  return row.inventory_quantity || '0'
}

function ImportPreview({ rows, products }: { rows: ProductImportPreviewRow[]; products: number }) {
  const seen = new Set<string>()

  return (
    <>
      <p className="text-[13px] text-ink">
        {plural(products, 'product')} · {plural(rows.length, 'variant')}
      </p>
      <div className={csvPreview.wrapper}>
        <table className={csvPreview.table}>
          <thead>
            <tr>
              <th className={csvPreview.th}>Row</th>
              <th className={csvPreview.th}>Product</th>
              <th className={csvPreview.th}>Variant</th>
              <th className={csvPreview.th}>SKU</th>
              <th className={`${csvPreview.th} text-right`}>Price</th>
              <th className={`${csvPreview.th} text-right`}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {previewRows(rows).map((row) => {
              const handle = row.handle.toLowerCase()
              const first = !seen.has(handle)
              seen.add(handle)
              return (
                <tr key={row.line}>
                  <td className={`${csvPreview.td} ${dataTable.mono}`}>{row.line}</td>
                  <td className={`${csvPreview.td} max-w-[220px]`}>
                    {first ? (
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {row.title || <span className="text-danger">Missing title</span>}
                        </div>
                        <div className={`truncate ${dataTable.mono}`}>{row.handle}</div>
                      </div>
                    ) : (
                      <span className={`truncate ${dataTable.mono}`}>↳ {row.handle}</span>
                    )}
                  </td>
                  <td className={csvPreview.td}>{variantLabel(row)}</td>
                  <td className={`${csvPreview.td} ${dataTable.mono}`}>{row.sku || '—'}</td>
                  <td className={`${csvPreview.td} text-right ${dataTable.mono}`}>
                    {row.price || <span className="text-danger">Missing</span>}
                  </td>
                  <td className={`${csvPreview.td} text-right`}>{stockLabel(row)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
