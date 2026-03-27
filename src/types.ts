// ===== Core Music Types =====

export interface Note {
  /** MIDI note number (0-127, middle C = 60) */
  midi: number;
  /** Note name (e.g., "C4", "F#5") */
  name: string;
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** Velocity (0-127) */
  velocity: number;
  /** Which track/hand (0 = right, 1 = left) */
  track: number;
}

export interface NoteSequence {
  notes: Note[];
  /** Total duration in seconds */
  duration: number;
  /** Tempo in BPM */
  tempo: number;
  /** Time signature numerator */
  timeSignatureNumerator: number;
  /** Time signature denominator */
  timeSignatureDenominator: number;
  /** Song title */
  title: string;
}

// ===== MIDI Types =====

export interface MidiInputEvent {
  note: number;
  velocity: number;
  timestamp: number;
  type: 'noteon' | 'noteoff';
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
}

// ===== Game Types =====

export type HitResult = 'perfect' | 'good' | 'miss' | 'wrong';

export interface NoteHit {
  note: Note;
  result: HitResult;
  timeDelta: number; // ms early (-) or late (+)
}

export interface ScoreReport {
  perfect: number;
  good: number;
  miss: number;
  wrong: number;
  totalNotes: number;
  accuracy: number; // 0-100
  maxCombo: number;
  grade: Grade;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

// ===== Game State =====

export type GameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'finished';

export interface GameConfig {
  speed: number; // 0.5 - 2.0 playback speed multiplier
  showChords: boolean;
  hitWindowMs: number; // timing tolerance in ms
  /** Seconds of notes visible above the hit line */
  visibleWindow: number;
}

// ===== Visualization =====

export interface FallingNote {
  note: Note;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hit: boolean;
  missed: boolean;
}

export interface PianoKey {
  midi: number;
  name: string;
  isBlack: boolean;
  x: number;
  width: number;
  pressed: boolean;
  highlighted: boolean;
}

// ===== Tutorial Types =====

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  level: number; // 1-5
  order: number; // sort within level
  prerequisiteIds: string[];
  notes: Note[];
  tempo: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
}

export interface TutorialProgress {
  tutorialId: string;
  completed: boolean;
  bestScore: ScoreReport | null;
  stars: number; // 0-3
  attempts: number;
}

// ===== Storage Types =====

export interface StoredSong {
  id?: number;
  title: string;
  fileName: string;
  fileType: 'midi' | 'musicxml' | 'pdf';
  noteSequence: NoteSequence;
  dateAdded: Date;
}

export interface StoredScore {
  id?: number;
  songId: number;
  score: ScoreReport;
  speed: number;
  datePlayed: Date;
}

// ===== Electron API =====

export interface ElectronAPI {
  getAppPath: () => Promise<string>;
  convertPdfToMusicXml?: (fileData: ArrayBuffer, fileName: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
