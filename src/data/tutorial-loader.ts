import { Tutorial, Note } from '../types';
import { midiToName } from '../utils/note-utils';

/**
 * Built-in tutorials with progressive difficulty.
 * Level 1: Single notes, one hand
 * Level 2: Full octave, simple rhythms
 * Level 3: Two hands, scales
 * Level 4: Chords, arpeggios
 * Level 5: Full songs
 */

function n(midi: number, time: number, dur: number, track = 0): Note {
  return { midi, name: midiToName(midi), startTime: time, duration: dur, velocity: 80, track };
}

const TUTORIALS: Tutorial[] = [
  // ===== Level 1: Getting Started =====
  {
    id: 'l1-middle-c',
    title: 'Middle C',
    description: 'Press Middle C (C4) in time with the falling notes.',
    level: 1,
    order: 1,
    prerequisiteIds: [],
    tempo: 80,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(60, 0, 0.8), n(60, 1, 0.8), n(60, 2, 0.8), n(60, 3, 0.8),
      n(60, 4, 0.8), n(60, 5, 0.8), n(60, 6, 0.8), n(60, 7, 1.5),
    ],
  },
  {
    id: 'l1-cde',
    title: 'C-D-E',
    description: 'Learn your first three notes: C, D, and E.',
    level: 1,
    order: 2,
    prerequisiteIds: ['l1-middle-c'],
    tempo: 80,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(60, 0, 0.8), n(62, 1, 0.8), n(64, 2, 0.8), n(62, 3, 0.8),
      n(60, 4, 0.8), n(62, 5, 0.8), n(64, 6, 0.8), n(60, 7, 1.5),
    ],
  },
  {
    id: 'l1-five-notes',
    title: 'Five Finger Position',
    description: 'C-D-E-F-G: The five-finger position.',
    level: 1,
    order: 3,
    prerequisiteIds: ['l1-cde'],
    tempo: 85,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(60, 0, 0.5), n(62, 0.5, 0.5), n(64, 1, 0.5), n(65, 1.5, 0.5),
      n(67, 2, 1), n(65, 3, 0.5), n(64, 3.5, 0.5),
      n(62, 4, 0.5), n(60, 4.5, 0.5), n(62, 5, 0.5), n(64, 5.5, 0.5),
      n(60, 6, 1.5),
    ],
  },

  // ===== Level 2: Expanding Range =====
  {
    id: 'l2-full-octave',
    title: 'Full Octave',
    description: 'Play all white keys from C4 to C5.',
    level: 2,
    order: 1,
    prerequisiteIds: ['l1-five-notes'],
    tempo: 90,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(60, 0, 0.4), n(62, 0.5, 0.4), n(64, 1, 0.4), n(65, 1.5, 0.4),
      n(67, 2, 0.4), n(69, 2.5, 0.4), n(71, 3, 0.4), n(72, 3.5, 0.8),
      n(72, 4.5, 0.4), n(71, 5, 0.4), n(69, 5.5, 0.4), n(67, 6, 0.4),
      n(65, 6.5, 0.4), n(64, 7, 0.4), n(62, 7.5, 0.4), n(60, 8, 1),
    ],
  },
  {
    id: 'l2-simple-melody',
    title: 'Mary Had a Little Lamb',
    description: 'A classic beginner melody.',
    level: 2,
    order: 2,
    prerequisiteIds: ['l2-full-octave'],
    tempo: 100,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(64, 0, 0.4), n(62, 0.5, 0.4), n(60, 1, 0.4), n(62, 1.5, 0.4),
      n(64, 2, 0.4), n(64, 2.5, 0.4), n(64, 3, 0.9),
      n(62, 4, 0.4), n(62, 4.5, 0.4), n(62, 5, 0.9),
      n(64, 6, 0.4), n(67, 6.5, 0.4), n(67, 7, 0.9),
      n(64, 8, 0.4), n(62, 8.5, 0.4), n(60, 9, 0.4), n(62, 9.5, 0.4),
      n(64, 10, 0.4), n(64, 10.5, 0.4), n(64, 11, 0.4), n(64, 11.5, 0.4),
      n(62, 12, 0.4), n(62, 12.5, 0.4), n(64, 13, 0.4), n(62, 13.5, 0.4),
      n(60, 14, 1.5),
    ],
  },
  {
    id: 'l2-eighth-notes',
    title: 'Eighth Notes',
    description: 'Faster rhythm practice with eighth notes.',
    level: 2,
    order: 3,
    prerequisiteIds: ['l2-simple-melody'],
    tempo: 95,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(60, 0, 0.2), n(62, 0.25, 0.2), n(64, 0.5, 0.2), n(65, 0.75, 0.2),
      n(67, 1, 0.2), n(65, 1.25, 0.2), n(64, 1.5, 0.2), n(62, 1.75, 0.2),
      n(60, 2, 0.4), n(64, 2.5, 0.4), n(67, 3, 0.4), n(64, 3.5, 0.4),
      n(60, 4, 0.2), n(62, 4.25, 0.2), n(64, 4.5, 0.2), n(65, 4.75, 0.2),
      n(67, 5, 0.2), n(69, 5.25, 0.2), n(71, 5.5, 0.2), n(72, 5.75, 0.2),
      n(72, 6, 1),
    ],
  },

  // ===== Level 3: Two Hands =====
  {
    id: 'l3-left-hand',
    title: 'Left Hand Intro',
    description: 'Practice with your left hand (C3-G3).',
    level: 3,
    order: 1,
    prerequisiteIds: ['l2-eighth-notes'],
    tempo: 80,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      n(48, 0, 0.8, 1), n(50, 1, 0.8, 1), n(52, 2, 0.8, 1), n(53, 3, 0.8, 1),
      n(55, 4, 0.8, 1), n(53, 5, 0.8, 1), n(50, 6, 0.8, 1), n(48, 7, 1.5, 1),
    ],
  },
  {
    id: 'l3-both-hands',
    title: 'Both Hands Together',
    description: 'Simple pattern with both hands at once.',
    level: 3,
    order: 2,
    prerequisiteIds: ['l3-left-hand'],
    tempo: 75,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      // Right hand melody
      n(60, 0, 0.9, 0), n(64, 1, 0.9, 0), n(67, 2, 0.9, 0), n(64, 3, 0.9, 0),
      n(60, 4, 0.9, 0), n(64, 5, 0.9, 0), n(67, 6, 0.9, 0), n(72, 7, 1.5, 0),
      // Left hand accompaniment
      n(48, 0, 0.9, 1), n(48, 1, 0.9, 1), n(48, 2, 0.9, 1), n(48, 3, 0.9, 1),
      n(48, 4, 0.9, 1), n(48, 5, 0.9, 1), n(48, 6, 0.9, 1), n(48, 7, 1.5, 1),
    ],
  },
  {
    id: 'l3-c-scale',
    title: 'C Major Scale',
    description: 'Play the C major scale with both hands.',
    level: 3,
    order: 3,
    prerequisiteIds: ['l3-both-hands'],
    tempo: 85,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      // Right hand ascending
      n(60, 0, 0.4, 0), n(62, 0.5, 0.4, 0), n(64, 1, 0.4, 0), n(65, 1.5, 0.4, 0),
      n(67, 2, 0.4, 0), n(69, 2.5, 0.4, 0), n(71, 3, 0.4, 0), n(72, 3.5, 0.8, 0),
      // Left hand ascending
      n(48, 4, 0.4, 1), n(50, 4.5, 0.4, 1), n(52, 5, 0.4, 1), n(53, 5.5, 0.4, 1),
      n(55, 6, 0.4, 1), n(57, 6.5, 0.4, 1), n(59, 7, 0.4, 1), n(60, 7.5, 0.8, 1),
    ],
  },

  // ===== Level 4: Chords =====
  {
    id: 'l4-c-chord',
    title: 'C Major Chord',
    description: 'Play a C major chord (C-E-G).',
    level: 4,
    order: 1,
    prerequisiteIds: ['l3-c-scale'],
    tempo: 70,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      // C major chords
      n(60, 0, 0.9, 0), n(64, 0, 0.9, 0), n(67, 0, 0.9, 0),
      n(60, 2, 0.9, 0), n(64, 2, 0.9, 0), n(67, 2, 0.9, 0),
      // G major chords
      n(55, 4, 0.9, 0), n(59, 4, 0.9, 0), n(62, 4, 0.9, 0),
      n(55, 6, 0.9, 0), n(59, 6, 0.9, 0), n(62, 6, 0.9, 0),
      // Back to C
      n(60, 8, 1.5, 0), n(64, 8, 1.5, 0), n(67, 8, 1.5, 0),
    ],
  },
  {
    id: 'l4-chord-progression',
    title: 'I-IV-V-I Progression',
    description: 'The most common chord progression in music.',
    level: 4,
    order: 2,
    prerequisiteIds: ['l4-c-chord'],
    tempo: 75,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      // C major (I)
      n(60, 0, 0.9, 0), n(64, 0, 0.9, 0), n(67, 0, 0.9, 0),
      n(48, 0, 0.9, 1),
      // F major (IV)
      n(60, 2, 0.9, 0), n(65, 2, 0.9, 0), n(69, 2, 0.9, 0),
      n(53, 2, 0.9, 1),
      // G major (V)
      n(59, 4, 0.9, 0), n(62, 4, 0.9, 0), n(67, 4, 0.9, 0),
      n(55, 4, 0.9, 1),
      // C major (I)
      n(60, 6, 1.5, 0), n(64, 6, 1.5, 0), n(67, 6, 1.5, 0),
      n(48, 6, 1.5, 1),
    ],
  },

  // ===== Level 5: Songs =====
  {
    id: 'l5-ode-to-joy',
    title: 'Ode to Joy',
    description: 'Beethoven\'s famous melody — the full version!',
    level: 5,
    order: 1,
    prerequisiteIds: ['l4-chord-progression'],
    tempo: 108,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: [
      // Line 1: E E F G G F E D C C D E E D D
      n(64, 0, 0.4), n(64, 0.5, 0.4), n(65, 1, 0.4), n(67, 1.5, 0.4),
      n(67, 2, 0.4), n(65, 2.5, 0.4), n(64, 3, 0.4), n(62, 3.5, 0.4),
      n(60, 4, 0.4), n(60, 4.5, 0.4), n(62, 5, 0.4), n(64, 5.5, 0.4),
      n(64, 6, 0.6), n(62, 6.75, 0.2), n(62, 7, 0.9),
      // Line 2: E E F G G F E D C C D E D C C
      n(64, 8, 0.4), n(64, 8.5, 0.4), n(65, 9, 0.4), n(67, 9.5, 0.4),
      n(67, 10, 0.4), n(65, 10.5, 0.4), n(64, 11, 0.4), n(62, 11.5, 0.4),
      n(60, 12, 0.4), n(60, 12.5, 0.4), n(62, 13, 0.4), n(64, 13.5, 0.4),
      n(62, 14, 0.6), n(60, 14.75, 0.2), n(60, 15, 0.9),
    ],
  },
];

export function getAllTutorials(): Tutorial[] {
  return TUTORIALS;
}

export function getTutorialsByLevel(level: number): Tutorial[] {
  return TUTORIALS.filter((t) => t.level === level).sort((a, b) => a.order - b.order);
}

export function getTutorial(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}

export function getTutorialLevels(): number[] {
  return [...new Set(TUTORIALS.map((t) => t.level))].sort();
}
