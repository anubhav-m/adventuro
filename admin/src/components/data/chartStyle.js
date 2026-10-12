// How every chart is drawn, from the theme tokens, so each reads the same in both themes.
export const AXIS_TICK = Object.freeze({ fill: 'var(--color-text-muted)' });
export const AXIS_LINE = Object.freeze({ stroke: 'var(--color-border-strong)' });
export const GRID_STROKE = 'var(--color-border)';
export const SERIES_INK = 'var(--color-text)';
// The edge of a bar in an ink of its own: it keeps a pale ink readable on the light sheet.
export const BAR_EDGE = 'var(--color-border-strong)';
export const HOVER_FILL = 'var(--color-surface-raised)';
export const CHART_MARGIN = Object.freeze({ top: 8, right: 12, bottom: 0, left: 0 });
