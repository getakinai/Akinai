import { Info } from 'lucide-react'

/** Caveats about the data shown, such as when session tracking started. */
export default function AnalyticsNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {notes.map((note) => (
        <p
          key={note}
          className="flex items-start gap-2 rounded-lg border border-line-2 bg-info-soft px-3.5 py-2.5 text-[13px] text-ink-2"
        >
          <Info size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-info" />
          {note}
        </p>
      ))}
    </div>
  )
}
