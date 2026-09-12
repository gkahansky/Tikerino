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

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
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
