import { Note, NoteHit, ScoreReport, GameState, GameConfig } from '../types';
import { InputMatcher } from './input-matcher';
import { ScoreTracker } from './score-tracker';
import { TimingClock } from '../core/timing';

/**
 * Main game engine — orchestrates input matching, scoring,
 * and communicates state to the visualization layer.
 */
export class GameEngine {
  private matcher: InputMatcher;
  private scorer: ScoreTracker;
  private clock: TimingClock;
  private notes: Note[] = [];
  private _state: GameState = 'idle';

  /** Callbacks for visualization */
  onNoteHit: ((hit: NoteHit) => void) | null = null;
  onNoteMiss: ((note: Note) => void) | null = null;
  onWrongNote: ((midi: number) => void) | null = null;
  onComboChange: ((combo: number) => void) | null = null;
  onFinish: ((report: ScoreReport) => void) | null = null;

  constructor(clock: TimingClock) {
    this.clock = clock;
    this.matcher = new InputMatcher();
    this.scorer = new ScoreTracker();

    // Wire up matcher callbacks to scorer
    this.matcher.onHit = (hit) => {
      this.scorer.recordHit(hit);
      this.onNoteHit?.(hit);
      this.onComboChange?.(this.scorer.currentCombo);
    };

    this.matcher.onMiss = (note) => {
      this.scorer.recordMiss();
      this.onNoteMiss?.(note);
      this.onComboChange?.(this.scorer.currentCombo);
    };

    this.matcher.onWrong = (midi) => {
      this.scorer.recordWrong();
      this.onWrongNote?.(midi);
      this.onComboChange?.(this.scorer.currentCombo);
    };
  }

  /** Initialize a new game session */
  setup(notes: Note[], config: GameConfig) {
    this.notes = notes;
    this.matcher.setNotes(notes);
    this.matcher.setHitWindow(config.hitWindowMs);
    this.scorer.reset(notes.length);
    this._state = 'idle';
  }

  /** Start the game */
  start() {
    this._state = 'playing';
  }

  /** Pause the game */
  pause() {
    this._state = 'paused';
  }

  /** Resume from pause */
  resume() {
    this._state = 'playing';
  }

  /** Called every frame from the game loop */
  update() {
    if (this._state !== 'playing') return;

    const time = this.clock.currentTime;

    // Check for missed notes
    this.matcher.checkMisses(time);

    // Check if all notes have been processed
    let maxTime = 0;
    for (const n of this.notes) {
      const end = n.startTime + n.duration;
      if (end > maxTime) maxTime = end;
    }
    if (time > maxTime + 1) {
      this._state = 'finished';
      this.onFinish?.(this.scorer.getReport());
    }
  }

  /** Process a MIDI note-on input */
  processInput(midiNote: number): NoteHit | null {
    if (this._state !== 'playing') return null;
    return this.matcher.processInput(midiNote, this.clock.currentTime);
  }

  /** Get current score report (for live display) */
  getReport(): ScoreReport {
    return this.scorer.getReport();
  }

  get state(): GameState {
    return this._state;
  }

  get combo(): number {
    return this.scorer.currentCombo;
  }

  /** Check if a specific note was hit */
  isNoteMatched(note: Note): boolean {
    return this.matcher.isMatched(note);
  }

  reset() {
    this.matcher.reset();
    this._state = 'idle';
  }
}
