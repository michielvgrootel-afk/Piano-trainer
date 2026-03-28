const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Convert MIDI number to note name (e.g., 60 -> "C4") */
export function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

/** Convert note name to MIDI number (e.g., "C4" -> 60) */
export function nameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d)$/);
  if (!match) return -1;
  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  const octave = parseInt(match[2]);
  if (noteIndex === -1) return -1;
  return (octave + 1) * 12 + noteIndex;
}

/** Check if a MIDI note is a black key */
export function isBlackKey(midi: number): boolean {
  const note = midi % 12;
  return [1, 3, 6, 8, 10].includes(note);
}

/** Get color for a note based on its track (right hand = blue, left hand = green) */
export function getNoteColor(track: number, hit: boolean = false): string {
  if (hit) return '#FFD700'; // gold on hit
  return track === 0 ? '#4FC3F7' : '#81C784'; // blue for right, green for left
}

/** Full 88-key keyboard range: A0 (21) to C8 (108) */
export const PIANO_MIN = 21;
export const PIANO_MAX = 108;
export const PIANO_KEYS = PIANO_MAX - PIANO_MIN + 1;

/** Get all white key MIDI numbers in the piano range */
export function getWhiteKeys(): number[] {
  const keys: number[] = [];
  for (let midi = PIANO_MIN; midi <= PIANO_MAX; midi++) {
    if (!isBlackKey(midi)) keys.push(midi);
  }
  return keys;
}

/** Get all black key MIDI numbers in the piano range */
export function getBlackKeys(): number[] {
  const keys: number[] = [];
  for (let midi = PIANO_MIN; midi <= PIANO_MAX; midi++) {
    if (isBlackKey(midi)) keys.push(midi);
  }
  return keys;
}
