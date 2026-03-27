/**
 * Centralized timing clock — single source of truth for all modules.
 * All visualization, audio, and input matching read from this clock.
 */
export class TimingClock {
  private _currentTime: number = 0;
  private _startTimestamp: number = 0;
  private _speed: number = 1.0;
  private _paused: boolean = true;
  private _pausedAt: number = 0;
  private _leadIn: number = 2; // seconds before the song starts

  /** Reset the clock for a new song */
  reset(leadIn: number = 2) {
    this._leadIn = leadIn;
    this._currentTime = -leadIn;
    this._startTimestamp = 0;
    this._speed = 1.0;
    this._paused = true;
    this._pausedAt = -leadIn;
  }

  /** Start or resume the clock */
  start() {
    if (!this._paused) return;
    this._paused = false;
    this._startTimestamp = performance.now() - (this._pausedAt + this._leadIn) / this._speed * 1000;
  }

  /** Pause the clock */
  pause() {
    if (this._paused) return;
    this._paused = true;
    this._pausedAt = this._currentTime;
  }

  /** Update the current time — call this every frame from rAF */
  update() {
    if (this._paused) return;
    const elapsed = (performance.now() - this._startTimestamp) / 1000;
    this._currentTime = -this._leadIn + elapsed * this._speed;
  }

  /** Set playback speed (0.25 - 2.0) */
  setSpeed(speed: number) {
    if (!this._paused) {
      // Recalculate start timestamp to maintain current position at new speed
      this._pausedAt = this._currentTime;
      this._startTimestamp = performance.now() - (this._pausedAt + this._leadIn) / speed * 1000;
    }
    this._speed = speed;
  }

  /** Seek to a specific time */
  seekTo(time: number) {
    this._currentTime = time;
    this._pausedAt = time;
    if (!this._paused) {
      this._startTimestamp = performance.now() - (time + this._leadIn) / this._speed * 1000;
    }
  }

  /** Get current song time in seconds (negative during lead-in) */
  get currentTime(): number {
    return this._currentTime;
  }

  get speed(): number {
    return this._speed;
  }

  get paused(): boolean {
    return this._paused;
  }

  get leadIn(): number {
    return this._leadIn;
  }
}

/** Singleton timing clock */
export const clock = new TimingClock();
