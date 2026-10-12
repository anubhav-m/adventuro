import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AXIS_LINE,
  AXIS_TICK,
  BAR_EDGE,
  CHART_MARGIN,
  GRID_STROKE,
  HOVER_FILL,
} from './chartStyle.js';
import { ChartTooltip } from './ChartTooltip.jsx';

const LABEL_WIDTH = 128;

// One bar per category, each in its own ink and named on the axis beside it, so no bar is told
// apart by colour alone. `data` is [{ label, value, ink }]; `formatValue` writes a value for the
// axis and `tooltipLines` is ChartTooltip's.
export function CategoryChart({ data, formatValue, tooltipLines }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={CHART_MARGIN} accessibilityLayer={false}>
        <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tickFormatter={formatValue}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={AXIS_LINE}
          width={LABEL_WIDTH}
        />
        <Tooltip
          cursor={{ fill: HOVER_FILL }}
          content={<ChartTooltip title={(row) => row.label} lines={tooltipLines} />}
        />
        <Bar dataKey="value" maxBarSize={24} isAnimationActive={false}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.ink} stroke={BAR_EDGE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
