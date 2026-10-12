// A tiny inline-SVG sparkline from a daily series — no chart library, so
// nothing to ship to the browser beyond a few path coordinates. Pure,
// unit-tested in sparkline.spec.ts.

export interface Sparkline {
  /** `points` attribute of the line. */
  line: string;
  /** `d` attribute of the filled area under the line. */
  area: string;
  /** A sentence for screen readers and the tooltip. */
  description: string;
}

export interface SparklineSize {
  width: number;
  height: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * The line and area of a series (oldest first), scaled from zero so a
 * quiet month doesn't look like a collapse — a baseline that follows the
 * minimum would make ordinary day-to-day noise read as a trend. `undefined`
 * under two points or without any activity: nothing to draw, not a flat line.
 */
export function sparkline(
  series: readonly number[] | undefined,
  { width, height }: SparklineSize,
  noun = "installs",
): Sparkline | undefined {
  if (!series || series.length < 2) return undefined;
  const values = series.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const max = Math.max(...values);
  if (max === 0) return undefined;
  const pad = 1; // keeps the stroke inside the viewBox
  const x = (i: number) => round(pad + (i * (width - 2 * pad)) / (values.length - 1));
  const y = (v: number) => round(height - pad - (v / max) * (height - 2 * pad));
  const coords = values.map((v, i) => `${x(i)},${y(v)}`);
  const total = values.reduce((sum, v) => sum + v, 0);
  return {
    line: coords.join(" "),
    area: `M${x(0)},${height - pad} L${coords.join(" L")} L${x(values.length - 1)},${height - pad} Z`,
    description: `Daily ${noun} over the last ${values.length} days: ${total.toLocaleString("en")} in total, up to ${max.toLocaleString("en")} a day`,
  };
}
