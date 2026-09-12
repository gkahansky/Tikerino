import { median } from './families.js';
import { bodySize } from './rules.js';
import type { Candle } from './types.js';

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function formatVolume(value: number): string {
  return value.toLocaleString('en-US');
}

function relativeVolume(v: number, medianVolume: number): string {
  if (medianVolume <= 0) return 'volume not comparable';
  const ratio = v / medianVolume;
  if (ratio >= 2) return 'far above the typical volume';
  if (ratio >= 1.35) return 'above the typical volume';
  if (ratio <= 0.5) return 'far below the typical volume';
  if (ratio <= 0.75) return 'below the typical volume';
  return 'about the typical volume';
}

function bodyShare(c: Candle): string {
  const range = c.h - c.l;
  if (range <= 0) return 'no range';
  const share = Math.round((bodySize(c) / range) * 100);
  return `body is ${share}% of the range`;
}

/**
 * The ordered screen-reader alternative to the chart, spec section 7.
 *
 * One entry per candle: direction, open/close, high/low, body vs range, volume vs
 * median. Every pick-the-candle target must be selectable from this list with the
 * same grading result as tapping it - the list is an equal input, not a summary.
 *
 * `timeframeLabel` ("1 day per candle") is turned into the period each candle
 * covers ("1 day") so the reader hears the unit without the phrase repeating
 * awkwardly on every row.
 */
export function describeCandles(candles: Candle[], timeframeLabel: string): string[] {
  const medianVolume = median(candles.map((c) => c.v));
  const period = timeframeLabel.replace(/\s*per\s+candle\s*$/i, '').trim() || timeframeLabel;
  const total = candles.length;

  return candles.map((c, position) => {
    const direction = c.c > c.o ? 'Bullish' : c.c < c.o ? 'Bearish' : 'Unchanged';
    const move =
      c.c > c.o
        ? 'closed higher than it opened'
        : c.c < c.o
          ? 'closed lower than it opened'
          : 'closed where it opened';

    return (
      `Candle ${position + 1} of ${total}, ${period}. ` +
      `${direction}: ${move}. ` +
      `Open ${formatPrice(c.o)}, close ${formatPrice(c.c)}, ` +
      `high ${formatPrice(c.h)}, low ${formatPrice(c.l)}. ` +
      `The ${bodyShare(c)}. ` +
      `Volume ${formatVolume(c.v)}, ${relativeVolume(c.v, medianVolume)}.`
    );
  });
}
