import { Note, NoteSequence } from '../types';

/** Create an empty NoteSequence */
export function createEmptySequence(): NoteSequence {
  return {
    notes: [],
    duration: 0,
    tempo: 120,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    title: 'Untitled',
  };
}

/** Sort notes by start time, then by MIDI number */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return a.midi - b.midi;
  });
}

/** Get the total duration of a note sequence */
export function getSequenceDuration(notes: Note[]): number {
  let max = 0;
  for (const n of notes) {
    const end = n.startTime + n.duration;
    if (end > max) max = end;
  }
  return max;
}

/** Scale all note timings by a speed multiplier */
export function scaleSequenceTiming(notes: Note[], speed: number): Note[] {
  return notes.map((n) => ({
    ...n,
    startTime: n.startTime / speed,
    duration: n.duration / speed,
  }));
}

/** Get notes that are active at a given time */
export function getActiveNotes(notes: Note[], time: number): Note[] {
  return notes.filter((n) => time >= n.startTime && time <= n.startTime + n.duration);
}

/** Get notes within a time window */
export function getNotesInWindow(notes: Note[], startTime: number, endTime: number): Note[] {
  return notes.filter((n) => {
    const noteEnd = n.startTime + n.duration;
    return noteEnd >= startTime && n.startTime <= endTime;
  });
}
