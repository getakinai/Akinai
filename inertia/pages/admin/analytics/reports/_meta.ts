import {
  BadgePercent,
  Banknote,
  Boxes,
  CalendarClock,
  ChartLine,
  ChartNoAxesColumn,
  CreditCard,
  Filter,
  Flag,
  Globe,
  Landmark,
  Link2,
  Map as MapIcon,
  Megaphone,
  MonitorSmartphone,
  MousePointerClick,
  Package,
  PackageCheck,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Undo2,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export type ReportTone = 'ok' | 'accent' | 'purple' | 'info' | 'warning' | 'danger'

/** Solid icon tile, white glyph. */
export const reportToneTile: Record<ReportTone, string> = {
  ok: 'bg-linear-to-br from-ok to-ok/70',
  accent: 'bg-linear-to-br from-accent to-accent/70',
  purple: 'bg-linear-to-br from-purple to-purple/70',
  info: 'bg-linear-to-br from-info to-info/70',
  warning: 'bg-linear-to-br from-warning to-warning/70',
  danger: 'bg-linear-to-br from-danger to-danger/70',
}

export const reportToneSoft: Record<ReportTone, string> = {
  ok: 'bg-ok-soft text-ok',
  accent: 'bg-accent-soft text-accent',
  purple: 'bg-purple-soft text-purple',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

type CategoryMeta = { icon: LucideIcon; tone: ReportTone }

const CATEGORY_META: Record<string, CategoryMeta> = {
  sales: { icon: TrendingUp, tone: 'ok' },
  traffic: { icon: Globe, tone: 'accent' },
  behavior: { icon: Filter, tone: 'purple' },
  customers: { icon: Users, tone: 'info' },
  marketing: { icon: Megaphone, tone: 'warning' },
  orders: { icon: ShoppingBag, tone: 'accent' },
  inventory: { icon: Warehouse, tone: 'ok' },
  finance: { icon: Landmark, tone: 'danger' },
  profit: { icon: PiggyBank, tone: 'ok' },
  retail: { icon: Store, tone: 'purple' },
  fraud: { icon: ShieldAlert, tone: 'danger' },
}

const REPORT_ICONS: Record<string, LucideIcon> = {
  sales_over_time: ChartLine,
  sales_by_product: Package,
  sales_by_variant: Tag,
  sales_by_market: Globe,
  sales_by_discount: BadgePercent,
  average_order_value: Receipt,
  sessions_over_time: ChartLine,
  sessions_by_source: MousePointerClick,
  sessions_by_referrer: Link2,
  sessions_by_landing_page: Flag,
  sessions_by_device: MonitorSmartphone,
  sessions_by_campaign: Megaphone,
  conversion_over_time: TrendingUp,
  conversion_funnel: Filter,
  product_views_to_cart: ShoppingCart,
  new_vs_returning_customers: UserPlus,
  returning_customer_rate: Repeat,
  first_vs_repeat_sales: ChartNoAxesColumn,
  customers_by_country: MapIcon,
  marketing_by_utm_source: MousePointerClick,
  marketing_by_utm_campaign: Megaphone,
  orders_over_time: ShoppingBag,
  fulfillment_status: PackageCheck,
  fulfillment_time: Truck,
  returns_over_time: Undo2,
  refunds_over_time: Banknote,
  stock_on_hand: Boxes,
  low_stock: Warehouse,
  days_of_stock: CalendarClock,
  finance_summary: Wallet,
  payments: CreditCard,
}

const FALLBACK: CategoryMeta = { icon: ChartNoAxesColumn, tone: 'accent' }

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK
}

export function reportMeta(key: string, category: string): CategoryMeta {
  const meta = categoryMeta(category)
  return { icon: REPORT_ICONS[key] ?? meta.icon, tone: meta.tone }
}
