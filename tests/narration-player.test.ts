import { describe, expect, it } from 'vitest';

import {
  buildNarrationPlan,
  type NarrationPlan,
  type NarrationSpriteManifest,
} from '../client/src/narration.js';
import {
  NarrationPlayer,
  STALL_TIMEOUT_MS,
  type NarrationAudio,
} from '../client/src/narration-player.js';
import type { Lesson } from '@tikerino/content';

/**
 * The player is driven by an injected clock and a fake audio element, so every
 * assertion here is about behaviour a real device would show: what gets seeked,
 * what gets assigned, and what happens when the audio refuses to cooperate.
 */
const lesson = {
  lessonId: 'fixture-lesson',
  topicId: 't',
  order: 0,
  title: 'Fixture',
  estimatedMinutes: 2,
  crownLevelCap: 3,
  skills: [],
  principleCard: { title: 'P', body: 'Principle body.', miniChart: null },
  guidedExample: {
    chart: {
      syntheticSeriesId: 'fixture',
      scenarioFamily: 'trend_up',
      scenarioSpecVersion: '1.0',
      seed: 'fixture',
      windowSize: 4,
      revealSize: 0,
      timeframeLabel: '1 day per candle',
    },
    steps: [
      { text: 'First step.', annotateCandleIndex: 0 },
      { text: 'Second step.', annotateCandleIndex: 3 },
    ],
  },
  exerciseIds: [],
} as unknown as Lesson;

const manifest: NarrationSpriteManifest = {
  lessonId: 'fixture-lesson',
  src: 'audio/lessons/fixture-lesson/walkthrough.mp3',
  segments: [
    { id: 'intro', startMs: 0, durationMs: 10_000 },
    { id: 'step-0', startMs: 10_000, durationMs: 4_000 },
    { id: 'step-1', startMs: 14_000, durationMs: 3_000 },
  ],
};

/** Records everything the player does to the element, which is the point. */
class FakeAudio implements NarrationAudio {
  srcAssignments: string[] = [];
  seeks: number[] = [];
  playCalls = 0;
  pauseCalls = 0;
  paused = true;
  playRejects = false;
  /** When false, currentTime stops moving even though we are "playing". */
  advances = true;

  private _src = '';
  private _currentTime = 0;

  get src(): string {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    this.srcAssignments.push(value);
  }
  get currentTime(): number {
    return this._currentTime;
  }
  set currentTime(value: number) {
    this._currentTime = value;
    this.seeks.push(value);
  }
  async play(): Promise<void> {
    this.playCalls += 1;
    if (this.playRejects) throw new Error('NotAllowedError');
    this.paused = false;
  }
  pause(): void {
    this.pauseCalls += 1;
    this.paused = true;
  }
  /** Simulate the media clock moving, as a real element would while playing. */
  advanceBy(seconds: number): void {
    if (this.advances) this._currentTime += seconds;
  }
}

function planWithAudio(): NarrationPlan {
  return buildNarrationPlan(lesson, manifest);
}

/**
 * Move both clocks forward together, as a really playing element does. Ticking
 * the wall clock alone looks exactly like stalled audio - which the player is
 * right to notice - so tests that are not about stalling must advance both.
 */
function advance(player: NarrationPlayer, audio: FakeAudio | null, fromMs: number, toMs: number, stepMs = 250) {
  for (let now = fromMs + stepMs; now <= toMs; now += stepMs) {
    audio?.advanceBy(stepMs / 1_000);
    player.tick(now);
  }
}

/** Run the walkthrough to its end, feeding the clock and the media clock together. */
function playThrough(player: NarrationPlayer, audio: FakeAudio | null, stepMs = 500, maxMs = 60_000) {
  for (let now = stepMs; now <= maxMs; now += stepMs) {
    audio?.advanceBy(stepMs / 1_000);
    const state = player.tick(now);
    if (state.finished) return { state, endedAt: now };
  }
  return { state: player.state, endedAt: maxMs };
}

describe('the sprite player', () => {
  it('assigns src exactly once for the whole walkthrough', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    const { state } = playThrough(player, audio);

    expect(state.finished).toBe(true);
    // The iOS rule: one load, blessed by the opening gesture. Anything more and
    // segments two onward go silent on a real device.
    expect(audio.srcAssignments).toEqual(['audio/lessons/fixture-lesson/walkthrough.mp3']);
    expect(player.srcAssignments).toBe(1);
  });

  it('seeks to each segment offset instead of loading a new file', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    playThrough(player, audio);

    // Every segment start, in order, in seconds.
    expect(audio.seeks).toEqual(expect.arrayContaining([0, 10, 14]));
    expect(audio.srcAssignments).toHaveLength(1);
  });

  it('plays the segments in order and finishes on the last one', async () => {
    const audio = new FakeAudio();
    const seen: number[] = [];
    const player = new NarrationPlayer({
      plan: planWithAudio(),
      audio,
      onChange: (s) => seen.push(s.segmentIndex),
    });

    await player.start(0);
    const { state } = playThrough(player, audio);

    expect(seen).toEqual([0, 1, 2, 2]);
    expect(state.segmentIndex).toBe(2);
    expect(state.finished).toBe(true);
    expect(state.playing).toBe(false);
  });

  it('spotlights the candle each step points at', async () => {
    const audio = new FakeAudio();
    const spotlights: (number | null)[] = [];
    const player = new NarrationPlayer({
      plan: planWithAudio(),
      audio,
      onChange: (s) => spotlights.push(s.segment.spotlightCandleIndex),
    });

    await player.start(0);
    playThrough(player, audio);

    expect(spotlights).toEqual([null, 0, 3, 3]);
  });

  it('draws the chart from the clock, not from the audio', async () => {
    const audio = new FakeAudio();
    const plan = planWithAudio();
    const player = new NarrationPlayer({ plan, audio });

    await player.start(0);
    expect(player.state.drawnCandles).toBe(0);

    // Audio stops moving entirely; the draw-in must not care.
    audio.advances = false;
    player.tick(5_000);
    expect(player.state.drawnCandles).toBe(2);
    player.tick(10_000);
    expect(player.state.drawnCandles).toBe(4);
  });
});

describe('when audio will not play', () => {
  it('falls back to silent and still completes the walkthrough', async () => {
    const audio = new FakeAudio();
    audio.playRejects = true;
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    expect(player.state.mode).toBe('silent');

    const { state } = playThrough(player, audio);
    expect(state.finished).toBe(true);
    expect(state.segmentIndex).toBe(2);
  });

  it('runs silently when there is no audio element at all', async () => {
    const player = new NarrationPlayer({ plan: buildNarrationPlan(lesson), audio: null });
    await player.start(0);
    expect(player.state.mode).toBe('silent');

    const { state } = playThrough(player, null);
    expect(state.finished).toBe(true);
  });

  it('gives up on stalled audio and carries on rather than freezing', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    expect(player.state.mode).toBe('audio');

    // The pipeline wedges: we believe we are playing, the media clock disagrees.
    audio.advances = false;
    player.tick(STALL_TIMEOUT_MS - 1);
    expect(player.state.mode).toBe('audio');

    player.tick(STALL_TIMEOUT_MS + 1);
    expect(player.state.mode).toBe('silent');
    expect(audio.pauseCalls).toBeGreaterThan(0);

    const { state } = playThrough(player, audio);
    expect(state.finished).toBe(true);
  });

  it('does not call a stall on audio that is simply still buffering briefly', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    audio.advances = false;
    player.tick(500);
    audio.advances = true;
    audio.advanceBy(0.5);
    player.tick(1_000);

    expect(player.state.mode).toBe('audio');
  });
});

describe('pause, resume and watch again', () => {
  it('pauses the element and stops the clock advancing the lesson', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    advance(player, audio, 0, 3_000);
    player.pause(3_000);

    expect(player.state.playing).toBe(false);
    expect(audio.pauseCalls).toBe(1);

    // Time passing while paused must not advance the walkthrough.
    const before = player.state.elapsedMs;
    player.tick(9_000);
    expect(player.state.elapsedMs).toBe(before);
  });

  it('resumes from where it stopped, seeking rather than reloading', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    advance(player, audio, 0, 3_000);
    player.pause(3_000);
    await player.resume(20_000);

    expect(player.state.playing).toBe(true);
    expect(player.state.elapsedMs).toBe(3_000);
    expect(audio.seeks[audio.seeks.length - 1]).toBeCloseTo(3, 5);
    expect(audio.srcAssignments).toHaveLength(1);
  });

  it('watches again from the top on the same element', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    playThrough(player, audio);
    await player.jumpTo(30_000, 0);

    expect(player.state.segmentIndex).toBe(0);
    expect(player.state.finished).toBe(false);
    expect(player.state.playing).toBe(true);
    expect(audio.srcAssignments).toHaveLength(1);
  });

  it('jumps to a chosen segment, which is how switching delivery lands in place', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    await player.jumpTo(1_000, 2);

    expect(player.state.segmentIndex).toBe(2);
    expect(player.state.segment.id).toBe('step-1');
    expect(audio.seeks[audio.seeks.length - 1]).toBeCloseTo(14, 5);
  });

  it('clamps a nonsense jump rather than throwing mid-lesson', async () => {
    const audio = new FakeAudio();
    const player = new NarrationPlayer({ plan: planWithAudio(), audio });

    await player.start(0);
    await player.jumpTo(1_000, 99);
    expect(player.state.segmentIndex).toBe(2);

    await player.jumpTo(2_000, -3);
    expect(player.state.segmentIndex).toBe(0);
  });
});
