import { cn } from '~/lib/styles'
import { toneText } from './_tones'
import type { Gauge } from './_types'

const SIZE = 60
const STROKE = 5
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function RingGauge({ gauge }: { gauge: Gauge }) {
  const offset = CIRCUMFERENCE * (1 - gauge.percent / 100)

  return (
    <div className="flex items-center gap-4">
      <div className="relative grid shrink-0 place-items-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={cn('-rotate-90', toneText[gauge.tone])}
          role="img"
          aria-label={`${gauge.label}: ${gauge.percent}%`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-line"
          />
          {gauge.percent > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-500"
            />
          )}
        </svg>
        <span className="absolute text-[12.5px] font-semibold tabular-nums">{gauge.percent}%</span>
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-medium">{gauge.label}</div>
        <div className="mt-1 text-[12.5px] text-muted">{gauge.caption}</div>
      </div>
    </div>
  )
}
