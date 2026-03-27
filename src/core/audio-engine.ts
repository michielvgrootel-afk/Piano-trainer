import * as Tone from 'tone';
import { Note } from '../types';

/**
 * Audio engine using Tone.js for MIDI playback with piano samples.
 * Uses a PolySynth as a fallback — can be upgraded to soundfonts later.
 */
export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private scheduledEvents: number[] = [];
  private _initialized = false;
  private _volume: number = -6; // dB

  async initialize() {
    if (this._initialized) return;

    try {
      await Tone.start();
    } catch (e) {
      console.warn('Tone.js audio context start failed (will retry on next interaction):', e);
    }

    this.synth = new Tone.PolySynth(Tone.Synth, {
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
    this.synth.maxPolyphony = 32;

    this.synth.volume.value = this._volume;
    this._initialized = true;
  }

  /** Schedule all notes for playback at their correct times */
  scheduleNotes(notes: Note[], speed: number = 1.0, startOffset: number = 0) {
    if (!this.synth) return;

    this.clearScheduled();

    const transport = Tone.getTransport();
    transport.cancel();
    transport.bpm.value = 120; // Fixed BPM — speed is handled via time scaling only

    notes.forEach((note) => {
      const time = note.startTime / speed + startOffset;
      if (time < 0) return;

      const eventId = transport.schedule((t) => {
        this.synth?.triggerAttackRelease(
          Tone.Frequency(note.midi, 'midi').toFrequency(),
          note.duration / speed,
          t,
          note.velocity / 127
        );
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
    if (this.synth) {
      this.synth.releaseAll();
    }
  }

  /** Set playback speed — requires rescheduling notes, BPM stays fixed */
  setSpeed(_speed: number) {
    // Speed changes are handled by rescheduling notes via scheduleNotes().
    // No BPM change needed since we use time-scaled scheduling.
  }

  /** Play a single note immediately (for MIDI input feedback) */
  playNote(midi: number, velocity: number = 80, duration: number = 0.3) {
    if (!this.synth) return;
    const freq = Tone.Frequency(midi, 'midi').toFrequency();
    this.synth.triggerAttackRelease(freq, duration, undefined, velocity / 127);
  }

  /** Set volume in dB (-60 to 0) */
  setVolume(db: number) {
    this._volume = db;
    if (this.synth) {
      this.synth.volume.value = db;
    }
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
    this.synth?.dispose();
    this.synth = null;
    this._initialized = false;
  }
}

export const audioEngine = new AudioEngine();
