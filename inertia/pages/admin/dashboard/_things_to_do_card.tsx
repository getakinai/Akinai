import { Link } from '@adonisjs/inertia/react'
import { Check, ChevronRight } from 'lucide-react'
import { card, cn } from '~/lib/styles'
import type { ThingToDo } from './_types'

export default function ThingsToDoCard({ items }: { items: ThingToDo[] }) {
  const open = items.filter((item) => item.count > 0).length

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>
            {open === 0 ? 'All clear' : `${open} need${open === 1 ? 's' : ''} attention`}
          </div>
          <h2 className={card.title}>Things to do</h2>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const done = item.count === 0
          return (
            <li key={item.id}>
              <Link
                route={item.route}
                qs={item.qs}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-paper focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'grid size-[22px] shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold tabular-nums',
                    done ? 'bg-ok-soft text-ok' : 'bg-accent text-paper'
                  )}
                >
                  {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : item.count}
                </span>
                <span
                  className={cn('min-w-0 flex-1 text-[14px]', done ? 'text-subtle' : 'text-ink')}
                >
                  {item.label}
                  {done && <span className="sr-only"> (none)</span>}
                </span>
                <ChevronRight size={15} className="shrink-0 text-subtle" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
