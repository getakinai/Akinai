import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  chartAxis,
  chartTooltip,
  seriesColor,
  tooltipValue,
  type ChartDatum,
  type ChartSeries,
} from './chart_theme'

type LineTrendChartProps = {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  label: string
  formatValue?: (value: number) => string
  height?: number
  /** Sparkline: no axes, grid or tooltip. */
  minimal?: boolean
}

/** Line chart for values over time; comparison series are dashed. */
export default function LineTrendChart({
  data,
  xKey,
  series,
  label,
  formatValue,
  height = 260,
  minimal = false,
}: LineTrendChartProps) {
  return (
    <figure aria-label={label} className="m-0 w-full min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={
            minimal
              ? { top: 4, right: 2, bottom: 4, left: 2 }
              : { top: 8, right: 12, bottom: 0, left: 0 }
          }
        >
          {!minimal && <CartesianGrid stroke="var(--line)" vertical={false} />}
          <XAxis
            dataKey={xKey}
            hide={minimal}
            stroke={chartAxis.stroke}
            tick={chartAxis.tick}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            hide={minimal}
            stroke={chartAxis.stroke}
            tick={chartAxis.tick}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => (formatValue ? formatValue(value) : String(value))}
          />
          {!minimal && (
            <Tooltip
              formatter={tooltipValue(formatValue)}
              contentStyle={chartTooltip.contentStyle}
              labelStyle={chartTooltip.labelStyle}
              cursor={chartTooltip.cursor}
            />
          )}
          {series.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={seriesColor(item, index)}
              strokeWidth={item.compare ? 1.5 : 2}
              strokeDasharray={item.compare ? '4 4' : undefined}
              dot={false}
              isAnimationActive={!minimal}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
