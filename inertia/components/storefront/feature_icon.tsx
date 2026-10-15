import {
  Clock,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { FeatureIcon as FeatureIconName } from '~/lib/storefront'

const ICONS: Record<FeatureIconName, LucideIcon> = {
  'truck': Truck,
  'leaf': Leaf,
  'shield-check': ShieldCheck,
  'refresh-cw': RefreshCw,
  'star': Star,
  'gift': Gift,
  'clock': Clock,
  'heart': Heart,
  'tag': Tag,
  'sparkles': Sparkles,
  'headphones': Headphones,
  'credit-card': CreditCard,
}

type FeatureIconProps = {
  name: FeatureIconName
  size?: number
  className?: string
}

export default function FeatureIcon({ name, size = 18, className }: FeatureIconProps) {
  const Icon = ICONS[name]
  return <Icon size={size} className={className} aria-hidden="true" />
}
