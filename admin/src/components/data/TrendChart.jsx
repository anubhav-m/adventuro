import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate, formatDay, formatNumber } from '../../lib/format.js';
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_MARGIN,
  GRID_STROKE,
  HOVER_FILL,
  SERIES_INK,
} from './chartStyle.js';
import { ChartTooltip } from './ChartTooltip.jsx';

export const TREND_KIND = Object.freeze({ LINE: 'line', BAR: 'bar' });

// One figure per day: `data` is [{ date: 'YYYY-MM-DD', [dataKey]: number, … }], one entry per
// day. A single series, so it is drawn in the text colour. `tooltipLines` is ChartTooltip's.
export function TrendChart({ data, dataKey, kind = TREND_KIND.LINE, tooltipLines }) {
  const isLine = kind === TREND_KIND.LINE;
  const Chart = isLine ? LineChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data} margin={CHART_MARGIN} accessibilityLayer={false}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={AXIS_LINE}
          minTickGap={32}
        />
        <YAxis
          allowDecimals={false}
          tickFormatter={formatNumber}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={isLine ? AXIS_LINE : { fill: HOVER_FILL }}
          content={<ChartTooltip title={(row) => formatDate(row.date)} lines={tooltipLines} />}
        />
        {isLine ? (
          <Line
            dataKey={dataKey}
            type="linear"
            stroke={SERIES_INK}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: SERIES_INK, stroke: SERIES_INK }}
            isAnimationActive={false}
          />
        ) : (
          <Bar dataKey={dataKey} fill={SERIES_INK} maxBarSize={28} isAnimationActive={false} />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
