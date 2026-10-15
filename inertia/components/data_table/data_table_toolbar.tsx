import { type ReactNode } from 'react'

export default function DataTableToolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 w-full flex-wrap items-center gap-2.5 sm:flex-1">{left}</div>
      {right && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {right}
        </div>
      )}
    </div>
  )
}
