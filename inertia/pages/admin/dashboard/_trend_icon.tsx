import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Trend } from './_types'

const icons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

export default function TrendIcon({ trend, size = 12 }: { trend: Trend; size?: number }) {
  const Icon = icons[trend]
  return <Icon size={size} aria-hidden="true" />
}
