import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const DEVIATIONS_PATH = resolve(here, '../content-deviations.json');

/** Reviewed, acknowledged content-schema violations. See content-deviations.json. */
export function loadDeviations(path = DEVIATIONS_PATH) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  return parsed.deviations ?? [];
}

export function warn(message) {
  console.warn(`  content warning: ${message}`);
}
