import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERATOR_VERSION, SCENARIO_SPEC_VERSION } from '@tikerino/engine';
import {
  indexPack,
  loadContentPack,
  type ContentDeviation,
  type ContentPack,
  type PackIndex,
} from '@tikerino/content';

const here = dirname(fileURLToPath(import.meta.url));

/** The pack is a plain JSON file day one - no database. */
export const CONTENT_PACK_PATH = resolve(here, '../../specs/tikerino-content-pack-v0.1.json');
export const DEVIATIONS_PATH = resolve(here, '../../content-deviations.json');

export interface LoadedContent {
  pack: ContentPack;
  index: PackIndex;
  /** Acknowledged schema violations found in this pack. Printed at boot. */
  warnings: string[];
}

function readDeviations(path: string): ContentDeviation[] {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { deviations?: ContentDeviation[] };
    return parsed.deviations ?? [];
  } catch {
    // No deviations file means no acknowledged violations: strictest behaviour.
    return [];
  }
}

/**
 * Load and validate at boot. A pack that fails validation throws here, which
 * stops the server from starting - "refuse to run on validation failure".
 */
export function loadContent(
  path: string = CONTENT_PACK_PATH,
  deviationsPath: string = DEVIATIONS_PATH,
): LoadedContent {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const warnings: string[] = [];
  const pack = loadContentPack(raw, {
    engineGeneratorVersion: GENERATOR_VERSION,
    engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
    knownDeviations: readDeviations(deviationsPath),
    onWarning: (message) => warnings.push(message),
  });
  return { pack, index: indexPack(pack), warnings };
}
