import { useMemo } from 'react';

import { cutWindow, describeCandles, generateSeries, type Candle } from '@tikerino/engine';
import type { ChartRef } from '@tikerino/content';

export interface LocalChart {
  candles: Candle[];
  descriptions: string[];
}

/**
 * Generate a LESSON chart in the browser.
 *
 * Only ever used for principle cards and guided examples, whose revealSize is 0 -
 * there is no post-T data in them to protect, and generating locally is what lets
 * the lesson shell work offline. Exercise charts are different: their seeds are
 * stripped from the client pack and their candles come from the window endpoint.
 */
export function useLocalChart(chart: ChartRef | null): LocalChart | null {
  return useMemo(() => {
    if (!chart) return null;
    if (chart.revealSize !== 0) {
      throw new Error(
        `Refusing to generate a chart with revealSize ${chart.revealSize} in the client: ` +
          'post-T candles are server-only.',
      );
    }
    const series = generateSeries({
      seed: chart.seed,
      family: chart.scenarioFamily,
      windowSize: chart.windowSize,
      revealSize: chart.revealSize,
      scenarioSpecVersion: chart.scenarioSpecVersion,
    });
    const candles = cutWindow(series);
    return { candles, descriptions: describeCandles(candles, chart.timeframeLabel) };
  }, [chart]);
}
