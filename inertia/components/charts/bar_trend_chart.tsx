import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  chartAxis,
  chartTooltip,
  seriesColor,
  tooltipValue,
  type ChartDatum,
  type ChartSeries,
} from './chart_theme'

type BarTrendChartProps = {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  label: string
  formatValue?: (value: number) => string
  height?: number
  /** Horizontal bars with category labels on the left, for ranked lists. */
  horizontal?: boolean
}

/** Bar chart for values over time or ranked categories. */
export default function BarTrendChart({
  data,
  xKey,
  series,
  label,
  formatValue,
  height = 260,
  horizontal = false,
}: BarTrendChartProps) {
  const format = (value: number) => (formatValue ? formatValue(value) : String(value))
  return (
    <figure aria-label={label} className="m-0 w-full min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--line)" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                stroke={chartAxis.stroke}
                tick={chartAxis.tick}
                tickLine={false}
                tickFormatter={format}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                stroke={chartAxis.stroke}
                tick={chartAxis.tick}
                tickLine={false}
                width={120}
                tickFormatter={(value: string) =>
                  value.length > 18 ? `${value.slice(0, 17)}…` : value
                }
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                stroke={chartAxis.stroke}
                tick={chartAxis.tick}
                tickLine={false}
                minTickGap={12}
              />
              <YAxis
                stroke={chartAxis.stroke}
                tick={chartAxis.tick}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={format}
              />
            </>
          )}
          <Tooltip
            formatter={tooltipValue(formatValue)}
            contentStyle={chartTooltip.contentStyle}
            labelStyle={chartTooltip.labelStyle}
            cursor={chartTooltip.cursor}
          />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={seriesColor(item, index)}
              fillOpacity={item.compare ? 0.45 : 1}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
