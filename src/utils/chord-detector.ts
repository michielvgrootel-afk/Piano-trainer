/**
 * Detect chord names from a set of simultaneously pressed MIDI notes.
 */

interface ChordPattern {
  name: string;
  intervals: number[]; // semitone intervals from root
}

// Ordered most-specific first so 4-note chords match before 3-note subsets
const CHORD_PATTERNS: ChordPattern[] = [
  { name: 'add9', intervals: [0, 4, 7, 14] },
  { name: 'maj7', intervals: [0, 4, 7, 11] },
  { name: 'min7', intervals: [0, 3, 7, 10] },
  { name: '7', intervals: [0, 4, 7, 10] },
  { name: 'dim7', intervals: [0, 3, 6, 9] },
  { name: '6', intervals: [0, 4, 7, 9] },
  { name: 'min6', intervals: [0, 3, 7, 9] },
  { name: 'maj', intervals: [0, 4, 7] },
  { name: 'min', intervals: [0, 3, 7] },
  { name: 'dim', intervals: [0, 3, 6] },
  { name: 'aug', intervals: [0, 4, 8] },
  { name: 'sus2', intervals: [0, 2, 7] },
  { name: 'sus4', intervals: [0, 5, 7] },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Given an array of MIDI note numbers, detect the chord being played.
 * Returns null if no chord is detected (fewer than 3 notes or no match).
 */
export function detectChord(midiNotes: number[]): string | null {
  if (midiNotes.length < 3) return null;

  // Normalize to pitch classes (0-11) and deduplicate
  const pitchClasses = [...new Set(midiNotes.map((n) => n % 12))].sort((a, b) => a - b);

  if (pitchClasses.length < 3) return null;

  // Try each pitch class as root
  for (const root of pitchClasses) {
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b);

    for (const pattern of CHORD_PATTERNS) {
      if (matchesPattern(intervals, pattern.intervals)) {
        const rootName = NOTE_NAMES[root];
        const suffix = pattern.name === 'maj' ? '' : pattern.name;
        return rootName + suffix;
      }
    }
  }

  return null;
}

function matchesPattern(intervals: number[], pattern: number[]): boolean {
  if (intervals.length < pattern.length) return false;
  // Check if all pattern intervals are present in the intervals
  return pattern.every((p) => intervals.includes(p));
}
