import { Note, FallingNote, GameConfig } from '../types';
import { isBlackKey, getNoteColor, PIANO_MIN, PIANO_MAX } from '../utils/note-utils';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private notes: Note[] = [];
  private hitNotes: Set<Note> = new Set();
  private missedNotes: Set<Note> = new Set();
  private config: GameConfig = {
    speed: 1.0,
    showChords: false,
    hitWindowMs: 200,
    visibleWindow: 3,
  };

  // Layout
  private keyboardHeight = 0;
  private hitLineY = 0;
  /** How far notes extend past the hit line into the keyboard (pixels) */
  private keyboardOverlap = 40;

  // Cached key layout (computed once)
  private cachedTotalWhiteKeys: number;
  private cachedKeyPositions: Map<number, { x: number; width: number }> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cachedTotalWhiteKeys = this.countWhiteKeys(PIANO_MIN, PIANO_MAX);
  }

  setNotes(notes: Note[]) {
    this.notes = notes;
    this.hitNotes.clear();
    this.missedNotes.clear();
  }

  setConfig(config: Partial<GameConfig>) {
    Object.assign(this.config, config);
  }

  markHit(note: Note) {
    this.hitNotes.add(note);
  }

  markMissed(note: Note) {
    this.missedNotes.add(note);
  }

  setKeyboardHeight(height: number) {
    this.keyboardHeight = height;
    // Notes should overlap into the top ~30% of the keyboard
    this.keyboardOverlap = height * 0.3;
  }

  resize() {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    // Hit line is pushed down into the keyboard zone
    this.hitLineY = rect.height;
    // Invalidate position cache since width changed
    this.cachedKeyPositions.clear();
  }

  private get width(): number {
    return this.canvas.width / window.devicePixelRatio;
  }

  private get height(): number {
    return this.canvas.height / window.devicePixelRatio;
  }

  private midiToX(midi: number): { x: number; width: number } {
    const cached = this.cachedKeyPositions.get(midi);
    if (cached) return cached;

    const whiteKeyWidth = this.width / this.cachedTotalWhiteKeys;
    const blackKeyWidth = whiteKeyWidth * 0.58;
    let pos: { x: number; width: number };

    if (isBlackKey(midi)) {
      const whiteKeysBefore = this.countWhiteKeys(PIANO_MIN, midi - 1);
      pos = { x: whiteKeysBefore * whiteKeyWidth - blackKeyWidth / 2, width: blackKeyWidth };
    } else {
      const whiteKeysBefore = this.countWhiteKeys(PIANO_MIN, midi - 1);
      pos = { x: whiteKeysBefore * whiteKeyWidth, width: whiteKeyWidth };
    }

    this.cachedKeyPositions.set(midi, pos);
    return pos;
  }

  private countWhiteKeys(from: number, to: number): number {
    let count = 0;
    for (let i = from; i <= to; i++) {
      if (!isBlackKey(i)) count++;
    }
    return count;
  }

  render(currentTime: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw lane lines
    this.drawLanes(ctx, w);

    // The "target" line where notes should be played — at the bottom of the canvas
    // Notes visually extend past this into the keyboard below
    const hitY = h;
    const visibleWindow = this.config.visibleWindow;
    const pixelsPerSecond = h / visibleWindow;

    // Draw falling notes
    for (const note of this.notes) {
      const noteEnd = note.startTime + note.duration;

      // Cull notes outside visible range (allow extra below for overlap)
      if (noteEnd < currentTime - 1 || note.startTime > currentTime + visibleWindow + 0.5) {
        continue;
      }

      const isHit = this.hitNotes.has(note);
      const isMissed = this.missedNotes.has(note);

      const { x, width } = this.midiToX(note.midi);
      const noteTopTime = note.startTime - currentTime;
      const noteBotTime = noteEnd - currentTime;
      const yTop = hitY - noteTopTime * pixelsPerSecond;
      const yBot = hitY - noteBotTime * pixelsPerSecond;
      const noteHeight = Math.max(yTop - yBot, 6);

      // Determine color
      let color: string;
      let glowColor: string;
      if (isHit) {
        color = '#FFD700';
        glowColor = 'rgba(255, 215, 0, 0.4)';
      } else if (isMissed) {
        color = '#FF4444';
        glowColor = 'rgba(255, 68, 68, 0.3)';
      } else {
        color = getNoteColor(note.track);
        glowColor = note.track === 0 ? 'rgba(79, 195, 247, 0.3)' : 'rgba(129, 199, 132, 0.3)';
      }

      const padding = 1.5;
      const radius = 5;

      // Note glow (underneath)
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x + padding, yBot, width - padding * 2, noteHeight, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Note body gradient
      const noteGrad = ctx.createLinearGradient(x, yBot, x, yBot + noteHeight);
      noteGrad.addColorStop(0, color);
      noteGrad.addColorStop(0.5, color);
      noteGrad.addColorStop(1, this.darkenColor(color, 0.2));
      ctx.fillStyle = noteGrad;
      ctx.beginPath();
      ctx.roundRect(x + padding, yBot, width - padding * 2, noteHeight, radius);
      ctx.fill();

      // Top highlight
      const highlightGrad = ctx.createLinearGradient(x, yBot, x, yBot + Math.min(noteHeight, 12));
      highlightGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
      highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.roundRect(x + padding + 1, yBot + 1, width - padding * 2 - 2, Math.min(noteHeight - 2, 10), [radius, radius, 0, 0]);
      ctx.fill();

      // Hit explosion effect
      if (isHit) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x - 3, yBot - 3, width + 6, noteHeight + 6, radius + 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Fade-to-transparent gradient at the very bottom so notes blend into keyboard
    const fadeH = 30;
    const fadeGrad = ctx.createLinearGradient(0, h - fadeH, 0, h);
    fadeGrad.addColorStop(0, 'rgba(13, 13, 26, 0)');
    fadeGrad.addColorStop(1, 'rgba(13, 13, 26, 0.6)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, h - fadeH, w, fadeH);
  }

  private drawLanes(ctx: CanvasRenderingContext2D, width: number) {
    const whiteKeyWidth = width / this.cachedTotalWhiteKeys;

    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= this.cachedTotalWhiteKeys; i++) {
      const x = i * whiteKeyWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
  }

  /** Darken a hex color by a factor (0-1) */
  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
  }
}
