import { Note, HitResult, NoteHit } from '../types';

/**
 * Matches MIDI input events against expected notes in the sequence.
 * Uses a timing window to determine hit accuracy.
 * Maintains a scan pointer to avoid re-scanning already-processed notes.
 */
export class InputMatcher {
  private notes: Note[] = [];
  private matchedNotes: Set<number> = new Set(); // indices into notes[]
  private hitWindowMs: number = 200; // +/- ms tolerance
  /** Index of the earliest note that hasn't been missed yet */
  private scanPointer: number = 0;

  /** Callbacks */
  onHit: ((hit: NoteHit) => void) | null = null;
  onMiss: ((note: Note) => void) | null = null;
  onWrong: ((midi: number, time: number) => void) | null = null;

  setNotes(notes: Note[]) {
    this.notes = notes;
    this.matchedNotes.clear();
    this.scanPointer = 0;
  }

  setHitWindow(ms: number) {
    this.hitWindowMs = ms;
  }

  /**
   * Called when a MIDI note-on event is received.
   * Returns the hit result or null if no matching note was found.
   */
  processInput(midiNote: number, currentTime: number): NoteHit | null {
    const windowSec = this.hitWindowMs / 1000;

    // Only search from scanPointer forward — notes before that are already missed/matched
    let bestIndex = -1;
    let bestDelta = Infinity;

    for (let i = this.scanPointer; i < this.notes.length; i++) {
      const note = this.notes[i];

      // If this note starts well past the window, no point continuing
      if (note.startTime - currentTime > windowSec) break;

      if (this.matchedNotes.has(i)) continue;
      if (note.midi !== midiNote) continue;

      const delta = currentTime - note.startTime;
      const absDelta = Math.abs(delta);

      if (absDelta <= windowSec && absDelta < bestDelta) {
        bestIndex = i;
        bestDelta = absDelta;
      }
    }

    if (bestIndex >= 0) {
      this.matchedNotes.add(bestIndex);
      const bestNote = this.notes[bestIndex];
      const deltaMs = (currentTime - bestNote.startTime) * 1000;
      const result = this.classifyHit(Math.abs(deltaMs));

      const hit: NoteHit = {
        note: bestNote,
        result,
        timeDelta: deltaMs,
      };

      this.onHit?.(hit);
      return hit;
    }

    // No matching note — this is a wrong note
    this.onWrong?.(midiNote, currentTime);
    return null;
  }

  /**
   * Check for notes that have passed the hit window without being played.
   * Only scans from the scan pointer forward, advancing it past missed notes.
   */
  checkMisses(currentTime: number) {
    const windowSec = this.hitWindowMs / 1000;

    while (this.scanPointer < this.notes.length) {
      const note = this.notes[this.scanPointer];

      // If this note is still within the hit window, stop scanning
      if (currentTime - note.startTime <= windowSec) break;

      // This note is past the window
      if (!this.matchedNotes.has(this.scanPointer)) {
        this.matchedNotes.add(this.scanPointer);
        this.onMiss?.(note);
      }

      this.scanPointer++;
    }
  }

  private classifyHit(absDeltaMs: number): HitResult {
    if (absDeltaMs <= 50) return 'perfect';
    return 'good'; // 50-200ms — within window, acceptable timing
  }

  /** Check if a note has been matched */
  isMatched(note: Note): boolean {
    const idx = this.notes.indexOf(note);
    return idx >= 0 && this.matchedNotes.has(idx);
  }

  reset() {
    this.matchedNotes.clear();
    this.scanPointer = 0;
  }
}
