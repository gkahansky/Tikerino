import type { Candle } from '@tikerino/engine';
import type { AnswerPayload, XpBreakdown } from '@tikerino/grading';

export interface WindowChart {
  syntheticSeriesId: string;
  scenarioSpecVersion: string;
  timeframeLabel: string;
  syntheticDataLabel: string;
  /** Exactly windowSize candles. Never anything at or past the cut point. */
  candles: Candle[];
}

export interface WindowResponse {
  exerciseId: string;
  curriculumVersion: string;
  generatorVersion: string;
  type: 'multiple_choice' | 'pick_the_candle';
  prompt: string;
  options: { optionId: string; text: string }[] | null;
  chart: WindowChart | null;
}

export interface AnswerResponse {
  exerciseId: string;
  correct: boolean;
  target: { optionId: string } | { candleIndex: number };
  xp: XpBreakdown;
  feedback: { correct: string; incorrect: string };
  reveal: { candles: Candle[]; disclaimer: string };
  audit: {
    syntheticSeriesId: string | null;
    scenarioSpecVersion: string;
    generatorVersion: string;
    curriculumVersion: string;
  };
}

export interface SubmitAnswerRequest {
  subjectId: string;
  exerciseId: string;
  answer: AnswerPayload;
  hintUsed: boolean;
  timeToAnswerMs: number;
  capturedOffline: boolean;
  assignmentSnapshotAt: string;
}

/** Thrown when the network is unreachable, as distinct from a server rejection. */
export class OfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'OfflineError';
  }
}

/** Error from the API (4xx/5xx). Carries the HTTP status for callers that need it. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Resolve the configured API base (or the empty string for same-origin).
 *
 * The common case is a single-origin deployment: the client bundle is served
 * by the same server that answers /api/..., so the browser uses a relative
 * path and no extra CORS configuration is required.
 *
 * The simplest deployment, and the one `npm run dev` reproduces via the Vite proxy.
 *
 * Set `VITE_API_BASE_URL` to an absolute origin to split the two apart - static
 * hosting for the client, a container for the server. Vite inlines it at build
 * time, so it is a build input and not a runtime setting: a client built for one
 * API origin cannot be repointed at another without rebuilding.
 *
 * CORS is now restricted to the origins listed in the server's CORS_ORIGINS
 * (or the dev defaults). When splitting origins you must configure both sides.
 */
export function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (value === '') return '';

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `VITE_API_BASE_URL must be an absolute http(s) URL or empty, got "${value}". ` +
        'Relative paths are not allowed here because the client inlines the value at build time.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `VITE_API_BASE_URL must be http or https, got "${value}".`,
    );
  }

  if (
    typeof location !== 'undefined' &&
    location.protocol === 'https:' &&
    parsed.protocol === 'http:'
  ) {
    throw new Error(
      `VITE_API_BASE_URL is "${value}" but the app is served over https. ` +
        'The browser blocks that request as mixed content; the API needs https too.',
    );
  }

  // Paths are appended as `${base}/api/...`, so a trailing slash would double up.
  return value.replace(/\/+$/, '');
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    // A failed fetch is the only reliable offline signal; navigator.onLine lies.
    throw new OfflineError();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new ApiError(response.status, body.detail ?? body.error ?? response.statusText);
  }
  return (await response.json()) as T;
}

export function fetchWindow(exerciseId: string): Promise<WindowResponse> {
  return request<WindowResponse>(`/api/exercises/${encodeURIComponent(exerciseId)}/window`);
}

export function submitAnswer(payload: SubmitAnswerRequest): Promise<AnswerResponse> {
  return request<AnswerResponse>('/api/answers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
