import { Archive, ArchiveRestore, CircleCheck, CircleDashed } from 'lucide-react'
import { FormButton } from '~/components/form'

type BulkActionsProps = {
  disabled?: boolean
}

/**
 * Archive / Unarchive buttons for a `DataTableBulkBar`.
 */
export function BulkArchiveActions({
  disabled,
  onArchive,
  onUnarchive,
}: BulkActionsProps & { onArchive: () => void; onUnarchive: () => void }) {
  return (
    <>
      <FormButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={onArchive}
      >
        <Archive size={15} /> Archive
      </FormButton>
      <FormButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={onUnarchive}
      >
        <ArchiveRestore size={15} /> Unarchive
      </FormButton>
    </>
  )
}

/**
 * Set active / Set draft buttons for resources with a draft/active status.
 */
export function BulkStatusActions({
  disabled,
  onActivate,
  onDraft,
}: BulkActionsProps & { onActivate: () => void; onDraft: () => void }) {
  return (
    <>
      <FormButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={onActivate}
      >
        <CircleCheck size={15} /> Set active
      </FormButton>
      <FormButton type="button" variant="secondary" size="sm" disabled={disabled} onClick={onDraft}>
        <CircleDashed size={15} /> Set draft
      </FormButton>
    </>
  )
}
