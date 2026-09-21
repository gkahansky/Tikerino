import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Candle } from '@tikerino/engine';

import { clampDrawCount } from '../narration';

/**
 * Locked: every touch target is at least 48x48. That sets the column width when
 * the candles ARE targets (pick_the_candle), which means the chart scrolls
 * sideways on a narrow phone.
 *
 * When the candles are not targets - lesson cards, guided examples, multiple
 * choice, the reveal - there is no target-size rule to satisfy, so the chart is
 * fitted to the viewport instead and the learner sees all of it at once. Making a
 * read-only chart scroll would cost comprehension for nothing.
 */
const MIN_COLUMN_WIDTH = 48;
/** Below this a candle stops being readable, so a fitted chart scrolls too. */
const MIN_READABLE_COLUMN_WIDTH = 16;
const PRICE_HEIGHT = 200;
const VOLUME_HEIGHT = 56;
const PANEL_GAP = 10;
const TOP_PAD = 12;
const BOTTOM_PAD = 26;

const CHART_HEIGHT = TOP_PAD + PRICE_HEIGHT + PANEL_GAP + VOLUME_HEIGHT + BOTTOM_PAD;

export interface CandleSelection {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
  /** Set after grading so the answer can be marked on the chart. */
  correctIndex?: number | null;
}

export interface CandleChartProps {
  /** The window candles - everything through cut point T. */
  candles: Candle[];
  /** Post-T candles. Only ever passed after the server has graded the answer. */
  revealCandles?: Candle[];
  timeframeLabel: string;
  syntheticDataLabel: string;
  /** Guided-example annotation. */
  highlightIndex?: number | null;
  selection?: CandleSelection;
  /** One line per candle from engine.describeCandles(), window then reveal. */
  descriptions: string[];
  showVolume?: boolean;
  /** Accessible name for the chart region. */
  label: string;
  /**
   * Narrated walkthrough: only the first N candles are on screen, each
   * animating in as it appears. Layout (width, price scale) always comes from
   * the full set, so nothing rescales while the chart draws in. Null = all.
   */
  drawCount?: number | null;
}

function useContainerWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export function CandleChart(props: CandleChartProps): JSX.Element {
  const {
    candles,
    revealCandles = [],
    timeframeLabel,
    syntheticDataLabel,
    highlightIndex = null,
    drawCount = null,
    selection,
    descriptions,
    showVolume = true,
    label,
  } = props;

  const shown = [...candles, ...revealCandles];
  const visible = clampDrawCount(drawCount, shown.length);
  const drawn = visible === null ? shown : shown.slice(0, visible);
  const [containerRef, containerWidth] = useContainerWidth();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  const interactive = selection !== undefined && selection.disabled !== true;
  const floorWidth = interactive ? MIN_COLUMN_WIDTH : MIN_READABLE_COLUMN_WIDTH;
  const columnWidth =
    shown.length > 0 && containerWidth > 0
      ? Math.max(floorWidth, containerWidth / shown.length)
      : floorWidth;
  const chartWidth = Math.max(columnWidth * shown.length, containerWidth);

  const highs = shown.map((c) => c.h);
  const lows = shown.map((c) => c.l);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const pricePad = (maxPrice - minPrice) * 0.08 || 1;
  const top = maxPrice + pricePad;
  const bottom = Math.max(minPrice - pricePad, 0);

  const y = (price: number): number =>
    TOP_PAD + PRICE_HEIGHT - ((price - bottom) / (top - bottom)) * PRICE_HEIGHT;

  const maxVolume = Math.max(...shown.map((c) => c.v), 1);
  const volumeTop = TOP_PAD + PRICE_HEIGHT + PANEL_GAP;
  const volumeY = (v: number): number => volumeTop + VOLUME_HEIGHT - (v / maxVolume) * VOLUME_HEIGHT;

  const selectable = interactive;

  // Keep the focused candle on screen when arrow keys walk past the fold.
  useEffect(() => {
    if (!selectable) return;
    buttonRefs.current[focusIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusIndex, selectable]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!selectable) return;
    const last = candles.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = Math.min(focusIndex + 1, last);
    else if (event.key === 'ArrowLeft') next = Math.max(focusIndex - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    buttonRefs.current[next]?.focus();
  };

  const bodyFor = (candle: Candle): JSX.Element => {
    const isBullish = candle.c > candle.o;
    const isBearish = candle.c < candle.o;
    // Colour is never the only signal: bullish is a HOLLOW body (paper fill,
    // coloured border), bearish is a SOLID filled body. Frozen encoding.
    const stroke = isBullish
      ? 'var(--data-up)'
      : isBearish
        ? 'var(--data-down)'
        : 'var(--ink-2)';
    const fill = isBearish ? 'var(--data-down)' : 'var(--paper)';

    const bodyTop = y(Math.max(candle.o, candle.c));
    const bodyBottom = y(Math.min(candle.o, candle.c));
    const height = Math.max(bodyBottom - bodyTop, 2);
    const bodyWidth = Math.min(columnWidth * 0.56, 26);
    const centre = columnWidth / 2;

    return (
      <g>
        <line
          x1={centre}
          x2={centre}
          y1={y(candle.h)}
          y2={y(candle.l)}
          stroke={stroke}
          strokeWidth={2}
        />
        <rect
          x={centre - bodyWidth / 2}
          y={bodyTop}
          width={bodyWidth}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={2}
        />
      </g>
    );
  };

  return (
    <figure className="m-0">
      {/*
        The chart scrolls horizontally when 48px columns do not fit the viewport,
        so it needs to be reachable and scrollable by keyboard alone - otherwise
        a keyboard user cannot see the candles past the fold.
      */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="group"
        aria-label={`${label}, scrollable chart`}
        className="card overflow-x-auto overflow-y-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative" style={{ width: chartWidth }}>
          <svg
            width={chartWidth}
            height={CHART_HEIGHT}
            viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`${label}. ${syntheticDataLabel} ${timeframeLabel}.`}
            className="block"
          >
            {/* Price gridlines. */}
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const price = bottom + (top - bottom) * fraction;
              return (
                <line
                  key={fraction}
                  x1={0}
                  x2={chartWidth}
                  y1={y(price)}
                  y2={y(price)}
                  stroke="var(--data-grid)"
                  strokeWidth={1}
                />
              );
            })}

            {drawn.map((candle, position) => {
              const isReveal = position >= candles.length;
              const isHighlighted = highlightIndex === candle.i && !isReveal;
              const isSelected = selection?.selectedIndex === candle.i && !isReveal;
              const isCorrect = selection?.correctIndex === candle.i && !isReveal;

              return (
                /*
                  Two nested groups on purpose. The OUTER one carries the
                  positional transform as an SVG attribute; the INNER one carries
                  the reveal animation. A CSS `transform` beats an SVG transform
                  attribute on the same element, so animating the outer group
                  would slide every revealed candle back to x=0 and stack them on
                  top of candle 1.
                */
                <g
                  key={`${candle.i}-${isReveal ? 'r' : 'w'}`}
                  transform={`translate(${position * columnWidth}, 0)`}
                >
                 <g
                  className={isReveal || visible !== null ? 'reveal-candle' : undefined}
                  style={
                    isReveal
                      ? { animationDelay: `${(position - candles.length) * 60}ms` }
                      : undefined
                  }
                 >
                  {(isSelected || isHighlighted || isCorrect) && (
                    <rect
                      x={2}
                      y={TOP_PAD - 6}
                      width={columnWidth - 4}
                      height={PRICE_HEIGHT + PANEL_GAP + VOLUME_HEIGHT + 12}
                      rx={10}
                      fill={isCorrect ? 'var(--brand-soft)' : 'transparent'}
                      stroke={isCorrect ? 'var(--brand-strong)' : 'var(--focus-ring)'}
                      strokeWidth={isSelected || isCorrect ? 3 : 2}
                      strokeDasharray={isHighlighted && !isSelected ? '5 4' : undefined}
                    />
                  )}

                  {bodyFor(candle)}

                  {showVolume && (
                    <rect
                      x={columnWidth / 2 - Math.min(columnWidth * 0.4, 18) / 2}
                      y={volumeY(candle.v)}
                      width={Math.min(columnWidth * 0.4, 18)}
                      height={volumeTop + VOLUME_HEIGHT - volumeY(candle.v)}
                      fill="var(--data-volume)"
                      rx={2}
                    />
                  )}

                  <text
                    x={columnWidth / 2}
                    y={CHART_HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={16}
                    fill="var(--ink-2)"
                    className="tabular"
                    aria-hidden="true"
                  >
                    {candle.i + 1}
                  </text>
                 </g>
                </g>
              );
            })}

            {/* Cut point T: everything right of this line arrived with the reveal. */}
            {revealCandles.length > 0 && (
              <line
                x1={candles.length * columnWidth}
                x2={candles.length * columnWidth}
                y1={TOP_PAD - 8}
                y2={CHART_HEIGHT - BOTTOM_PAD}
                stroke="var(--ink-2)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/*
            Tap and keyboard targets, one per window candle, sized to the column
            (>= 48px) and the full chart height. Grading is identical whether the
            learner taps here, arrows here, or uses the text list below.
          */}
          {selection && (
            <div
              className="absolute inset-0 flex"
              onKeyDown={onKeyDown}
              role="group"
              aria-label="Pick a candle"
            >
              {candles.map((candle, position) => (
                <button
                  key={candle.i}
                  ref={(element) => {
                    buttonRefs.current[position] = element;
                  }}
                  type="button"
                  disabled={selection.disabled}
                  aria-pressed={selection.selectedIndex === candle.i}
                  aria-label={descriptions[position] ?? `Candle ${candle.i + 1}`}
                  tabIndex={position === focusIndex ? 0 : -1}
                  onFocus={() => setFocusIndex(position)}
                  onClick={() => selection.onSelect(candle.i)}
                  className="h-full bg-transparent border-0 p-0 cursor-pointer"
                  style={{ width: columnWidth, minWidth: MIN_COLUMN_WIDTH }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/*
        No generated-data caption chip: Guy ruled 12 Sep that the Terms page
        carries it and it is not worth chart real estate. The label still
        lives in the chart's accessible name for screen readers.
      */}
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-ink-2 text-xs tabular">{timeframeLabel}</span>
      </figcaption>

      {/*
        The ordered text alternative, from engine.describeCandles(). Open to
        everyone, not hidden off-screen: it is a second, equal way to read and
        answer, and sighted learners use it too.
      */}
      <details className="mt-3">
        <summary className="target flex items-center text-brand-ink font-semibold cursor-pointer text-sm">
          Read the candles as text
        </summary>
        <ol className="mt-2 space-y-2 list-none p-0">
          {drawn.map((candle, position) => {
            const isReveal = position >= candles.length;
            return (
              <li key={`${candle.i}-${isReveal ? 'r' : 'w'}`} className="text-sm leading-relaxed">
                <span className="tabular">{descriptions[position]}</span>
                {selection && !isReveal && (
                  <button
                    type="button"
                    disabled={selection.disabled}
                    aria-pressed={selection.selectedIndex === candle.i}
                    onClick={() => selection.onSelect(candle.i)}
                    className="option target ml-2 px-3 py-2 text-sm font-semibold"
                  >
                    {selection.selectedIndex === candle.i
                      ? `Candle ${candle.i + 1} selected`
                      : `Select candle ${candle.i + 1}`}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </details>
    </figure>
  );
}
