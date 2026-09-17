/**
 * Playing a narration plan, on one audio element, without iOS going silent.
 *
 * The constraint that shapes this file: iOS Safari treats assigning a new `src`
 * outside a user gesture as a fresh media load and refuses to start it. A player
 * that swaps one file per segment therefore plays the first segment and goes
 * quiet for the rest - silently, because every `play()` after the first rejects
 * and the walkthrough carries on looking fine. So there is one merged file per
 * lesson and the player *seeks* between offsets on the element the opening tap
 * already blessed. `src` is assigned once, ever.
 *
 * Headless on purpose: it owns the state machine and takes the audio element as
 * an interface, so the seeking, the stall guard and the silent fallback are
 * testable without a browser. The React hook in useNarration.ts is glue.
 *
 * Time comes from the caller via tick(now). The chart's draw-in is computed from
 * the plan and the wall clock, never from audio metadata - a stalled pipeline
 * must not be able to freeze the lesson.
 */
import {
  drawnCandlesAt,
  type NarrationPlan,
  type NarrationSegment,
} from './narration';

/** The slice of HTMLAudioElement this player uses. */
export interface NarrationAudio {
  src: string;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
}

export type NarrationMode = 'audio' | 'silent';

export interface NarrationState {
  segmentIndex: number;
  segment: NarrationSegment;
  /** Milliseconds into the walkthrough. */
  elapsedMs: number;
  playing: boolean;
  finished: boolean;
  /** Candles drawn so far in the intro draw-in. */
  drawnCandles: number;
  /**
   * 'silent' once audio has proved unavailable: play() rejected, there was no
   * audio to begin with, or the pipeline stalled. The walkthrough continues on
   * the clock either way, which is what keeps a lesson watchable offline or on a
   * device that refuses to autoplay.
   */
  mode: NarrationMode;
}

/**
 * How long audio may fail to advance, while we believe it is playing, before we
 * stop believing it. Two seconds is long enough not to trip on ordinary buffering
 * and short enough that a learner does not sit in front of a frozen chart.
 */
export const STALL_TIMEOUT_MS = 2_000;

export interface NarrationPlayerOptions {
  plan: NarrationPlan;
  /** Absent when there is no audio element or no audio to play: silent from the start. */
  audio?: NarrationAudio | null;
  /** Reports state changes. Called on every transition, not on every tick. */
  onChange?: (state: NarrationState) => void;
}

export class NarrationPlayer {
  private readonly plan: NarrationPlan;
  private readonly audio: NarrationAudio | null;
  private readonly onChange?: (state: NarrationState) => void;

  private segmentIndex = 0;
  private playing = false;
  private finished = false;
  private mode: NarrationMode;
  private srcAssigned = false;

  /** Wall clock at which the current segment's playback began. */
  private segmentStartedAt = 0;
  /** Milliseconds of the current segment already played before the last pause. */
  private segmentConsumedMs = 0;

  private lastAudioTime = 0;
  /** Null until audio has been observed at all; 0 is a real clock value, not "unset". */
  private lastAudioProgressAt: number | null = null;

  constructor(options: NarrationPlayerOptions) {
    this.plan = options.plan;
    this.audio = options.audio ?? null;
    this.onChange = options.onChange;
    this.mode = this.audio && this.plan.audioSrc ? 'audio' : 'silent';
  }

  /** How many times `src` has been assigned. The iOS rule, made observable. */
  get srcAssignments(): number {
    return this.srcAssigned ? 1 : 0;
  }

  get state(): NarrationState {
    const segment = this.plan.segments[this.segmentIndex]!;
    const elapsedMs = segment.startMs + this.segmentConsumedMs;
    return {
      segmentIndex: this.segmentIndex,
      segment,
      elapsedMs,
      playing: this.playing,
      finished: this.finished,
      drawnCandles: drawnCandlesAt(this.plan, elapsedMs),
      mode: this.mode,
    };
  }

  /**
   * Begin, from a user gesture.
   *
   * The first call is what blesses the element for the rest of the walkthrough,
   * so it is also the only place `src` is ever set. If play() rejects - autoplay
   * policy, a codec the device will not touch - the walkthrough continues
   * silently rather than stopping, and the caller learns from `mode`.
   */
  async start(now: number, fromSegmentIndex = 0): Promise<void> {
    this.segmentIndex = clampIndex(fromSegmentIndex, this.plan.segments.length);
    this.segmentConsumedMs = 0;
    this.finished = false;
    await this.beginSegment(now);
    this.emit();
  }

  /** Move to a segment and play it: used by "watch again" and by mode switching. */
  async jumpTo(now: number, segmentIndex: number): Promise<void> {
    this.segmentIndex = clampIndex(segmentIndex, this.plan.segments.length);
    this.segmentConsumedMs = 0;
    this.finished = false;
    await this.beginSegment(now);
    this.emit();
  }

  pause(now: number): void {
    if (!this.playing) return;
    this.accrue(now);
    this.playing = false;
    this.audio?.pause();
    this.emit();
  }

  async resume(now: number): Promise<void> {
    if (this.playing || this.finished) return;
    this.segmentStartedAt = now;
    this.playing = true;
    await this.playAudioFrom(this.currentSegment().startMs + this.segmentConsumedMs, now);
    this.emit();
  }

  /** Stop and release. Safe to call more than once. */
  stop(): void {
    this.playing = false;
    this.audio?.pause();
  }

  /**
   * Advance the clock. Returns the state so a caller can render from it.
   *
   * Everything time-based happens here: segment transitions, the draw-in, and
   * the stall guard. Audio is the thing being kept in step, never the thing
   * driving the step.
   */
  tick(now: number): NarrationState {
    if (!this.playing || this.finished) return this.state;

    const segment = this.currentSegment();
    // Bank the time first, so elapsedMs - and with it the draw-in - is live
    // within a segment rather than only at its boundaries.
    this.accrue(now);
    const consumed = this.segmentConsumedMs;

    if (this.mode === 'audio') this.checkForStall(now);

    if (consumed >= segment.durationMs) {
      const next = this.segmentIndex + 1;
      if (next >= this.plan.segments.length) {
        this.segmentIndex = this.plan.segments.length - 1;
        this.segmentConsumedMs = segment.durationMs;
        this.playing = false;
        this.finished = true;
        this.audio?.pause();
        this.emit();
        return this.state;
      }
      this.segmentIndex = next;
      this.segmentConsumedMs = 0;
      this.segmentStartedAt = now;
      // A segment change is a seek, never a load: same element, new offset.
      this.seekTo(this.currentSegment().startMs);
      this.emit();
      return this.state;
    }

    return this.state;
  }

  private currentSegment(): NarrationSegment {
    return this.plan.segments[this.segmentIndex]!;
  }

  /** Move wall-clock time into the current segment's consumed total, once. */
  private accrue(now: number): void {
    this.segmentConsumedMs += Math.max(0, now - this.segmentStartedAt);
    this.segmentStartedAt = now;
  }

  private async beginSegment(now: number): Promise<void> {
    this.segmentStartedAt = now;
    this.playing = true;
    await this.playAudioFrom(this.currentSegment().startMs, now);
  }

  private async playAudioFrom(positionMs: number, now: number): Promise<void> {
    if (this.mode !== 'audio' || !this.audio) return;

    if (!this.srcAssigned) {
      // The one and only assignment, inside the gesture that started playback.
      this.audio.src = this.plan.audioSrc!;
      this.srcAssigned = true;
    }
    this.seekTo(positionMs);

    try {
      await this.audio.play();
      this.lastAudioTime = this.audio.currentTime;
      this.lastAudioProgressAt = now;
    } catch {
      // Blocked or unplayable. The lesson is more important than the voice.
      this.mode = 'silent';
    }
  }

  private seekTo(positionMs: number): void {
    if (this.mode !== 'audio' || !this.audio) return;
    this.audio.currentTime = positionMs / 1_000;
    this.lastAudioTime = this.audio.currentTime;
  }

  private checkForStall(now: number): void {
    if (!this.audio) return;
    const current = this.audio.currentTime;
    if (current > this.lastAudioTime) {
      this.lastAudioTime = current;
      this.lastAudioProgressAt = now;
      return;
    }
    if (this.lastAudioProgressAt === null) {
      this.lastAudioProgressAt = now;
      return;
    }
    if (now - this.lastAudioProgressAt >= STALL_TIMEOUT_MS) {
      // Audio has stopped moving while we believe it is playing. Carry on
      // silently: a frozen chart is a broken lesson, a quiet one is a readable
      // lesson, and the captions carry the same words either way.
      this.mode = 'silent';
      this.audio.pause();
      this.emit();
    }
  }

  private emit(): void {
    this.onChange?.(this.state);
  }
}

function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.trunc(index), length - 1);
}
