/** Series colors from the app theme tokens, so charts follow light and dark mode. */
export const CHART_COLORS = [
  'var(--accent)',
  'var(--purple)',
  'var(--info)',
  'var(--ok)',
  'var(--warning)',
  'var(--danger)',
]

export const CHART_COMPARE_COLOR = 'var(--subtle)'

export const chartAxis = {
  stroke: 'var(--line-2)',
  tick: { fill: 'var(--muted)', fontSize: 11 },
}

export const chartTooltip = {
  contentStyle: {
    background: 'var(--card)',
    border: '1px solid var(--line-2)',
    borderRadius: 10,
    fontSize: 12.5,
    color: 'var(--ink)',
  },
  labelStyle: { color: 'var(--muted)', marginBottom: 4 },
  cursor: { stroke: 'var(--line-2)', fill: 'var(--line)', fillOpacity: 0.4 },
}

export type ChartSeries = {
  key: string
  label: string
  color?: string
  /** Comparison series are drawn dashed and muted. */
  compare?: boolean
}

export type ChartDatum = Record<string, string | number | null>

export function seriesColor(series: ChartSeries, index: number): string {
  if (series.color) return series.color
  return series.compare ? CHART_COMPARE_COLOR : CHART_COLORS[index % CHART_COLORS.length]
}

export function tooltipValue(formatValue?: (value: number) => string) {
  return (value: unknown) => {
    const number = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(number)) return String(value ?? '')
    return formatValue ? formatValue(number) : number.toLocaleString()
  }
}
