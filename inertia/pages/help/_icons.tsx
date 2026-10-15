import {
  CircleHelp,
  CreditCard,
  Rocket,
  RotateCcw,
  ShoppingBag,
  Truck,
  User,
  type LucideIcon,
} from 'lucide-react'
import type { HelpIconName } from './_types'

const ICONS: Record<HelpIconName, LucideIcon> = {
  'rocket': Rocket,
  'shopping-bag': ShoppingBag,
  'credit-card': CreditCard,
  'truck': Truck,
  'rotate-ccw': RotateCcw,
  'user': User,
  'help-circle': CircleHelp,
}

export function HelpIcon({ name, size = 18 }: { name: HelpIconName; size?: number }) {
  const Icon = ICONS[name] ?? CircleHelp
  return <Icon size={size} aria-hidden="true" />
}
