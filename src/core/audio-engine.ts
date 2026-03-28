import * as Tone from 'tone';
import { Note } from '../types';

/**
 * Audio engine using Tone.js Sampler with real piano samples (Salamander Grand Piano).
 * Falls back to a shaped synth if samples fail to load.
 */

// Salamander Grand Piano samples (freely available, hosted on multiple CDNs)
const PIANO_SAMPLES_BASE = 'https://tonejs.github.io/audio/salamander/';

// We load a subset of notes across the full range — Tone.js interpolates the rest
const SAMPLE_MAP: Record<string, string> = {
  A0: 'A0v8.mp3',
  C1: 'C1v8.mp3',
  'D#1': 'Ds1v8.mp3',
  'F#1': 'Fs1v8.mp3',
  A1: 'A1v8.mp3',
  C2: 'C2v8.mp3',
  'D#2': 'Ds2v8.mp3',
  'F#2': 'Fs2v8.mp3',
  A2: 'A2v8.mp3',
  C3: 'C3v8.mp3',
  'D#3': 'Ds3v8.mp3',
  'F#3': 'Fs3v8.mp3',
  A3: 'A3v8.mp3',
  C4: 'C4v8.mp3',
  'D#4': 'Ds4v8.mp3',
  'F#4': 'Fs4v8.mp3',
  A4: 'A4v8.mp3',
  C5: 'C5v8.mp3',
  'D#5': 'Ds5v8.mp3',
  'F#5': 'Fs5v8.mp3',
  A5: 'A5v8.mp3',
  C6: 'C6v8.mp3',
  'D#6': 'Ds6v8.mp3',
  'F#6': 'Fs6v8.mp3',
  A6: 'A6v8.mp3',
  C7: 'C7v8.mp3',
  'D#7': 'Ds7v8.mp3',
  C8: 'C8v8.mp3',
};

export class AudioEngine {
  private sampler: Tone.Sampler | null = null;
  private fallbackSynth: Tone.PolySynth | null = null;
  private scheduledEvents: number[] = [];
  private _initialized = false;
  private _samplerReady = false;
  private _volume: number = -6; // dB

  async initialize() {
    if (this._initialized) return;

    try {
      await Tone.start();
    } catch (e) {
      console.warn('Tone.js audio context start failed (will retry on next interaction):', e);
    }

    // Build full URL map
    const urls: Record<string, string> = {};
    for (const [note, file] of Object.entries(SAMPLE_MAP)) {
      urls[note] = file;
    }

    // Load sampler with real piano samples
    this.sampler = new Tone.Sampler({
      urls,
      baseUrl: PIANO_SAMPLES_BASE,
      release: 1.5,
      onload: () => {
        console.log('Piano samples loaded successfully');
        this._samplerReady = true;
      },
      onerror: (err: Error) => {
        console.warn('Failed to load piano samples, using fallback synth:', err);
        this._samplerReady = false;
      },
    }).toDestination();

    this.sampler.volume.value = this._volume;

    // Fallback synth in case samples don't load
    this.fallbackSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8',
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).toDestination();
    this.fallbackSynth.maxPolyphony = 32;
    this.fallbackSynth.volume.value = this._volume;

    this._initialized = true;
  }

  private get instrument(): Tone.Sampler | Tone.PolySynth {
    if (this._samplerReady && this.sampler) return this.sampler;
    return this.fallbackSynth!;
  }

  /** Schedule all notes for playback at their correct times */
  scheduleNotes(notes: Note[], speed: number = 1.0, startOffset: number = 0) {
    if (!this._initialized) return;

    this.clearScheduled();

    const transport = Tone.getTransport();
    transport.cancel();
    transport.bpm.value = 120;

    notes.forEach((note) => {
      const time = note.startTime / speed + startOffset;
      if (time < 0) return;

      const eventId = transport.schedule((t) => {
        const freq = Tone.Frequency(note.midi, 'midi').toFrequency();
        const dur = note.duration / speed;
        this.instrument.triggerAttackRelease(freq, dur, t, note.velocity / 127);
      }, time);
      this.scheduledEvents.push(eventId);
    });
  }

  /** Start playback from current transport position */
  play() {
    const transport = Tone.getTransport();
    transport.start();
  }

  /** Pause playback */
  pause() {
    const transport = Tone.getTransport();
    transport.pause();
  }

  /** Stop and reset playback */
  stop() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    this.clearScheduled();
    if (this._samplerReady && this.sampler) {
      this.sampler.releaseAll();
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.releaseAll();
    }
  }

  /** Set playback speed — requires rescheduling notes, BPM stays fixed */
  setSpeed(_speed: number) {
    // Speed changes are handled by rescheduling notes via scheduleNotes().
  }

  /** Play a single note immediately (for MIDI input feedback) */
  playNote(midi: number, velocity: number = 80, duration: number = 0.3) {
    if (!this._initialized) return;
    const freq = Tone.Frequency(midi, 'midi').toFrequency();
    this.instrument.triggerAttackRelease(freq, duration, undefined, velocity / 127);
  }

  /** Set volume in dB (-60 to 0) */
  setVolume(db: number) {
    this._volume = db;
    if (this.sampler) {
      this.sampler.volume.value = db;
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.volume.value = db;
    }
  }

  /** Whether real piano samples have loaded */
  get samplerReady(): boolean {
    return this._samplerReady;
  }

  private clearScheduled() {
    const transport = Tone.getTransport();
    this.scheduledEvents.forEach((id) => transport.clear(id));
    this.scheduledEvents = [];
  }

  get initialized(): boolean {
    return this._initialized;
  }

  dispose() {
    this.stop();
    this.sampler?.dispose();
    this.fallbackSynth?.dispose();
    this.sampler = null;
    this.fallbackSynth = null;
    this._initialized = false;
    this._samplerReady = false;
  }
}

export const audioEngine = new AudioEngine();
