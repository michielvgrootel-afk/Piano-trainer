import { isBlackKey, PIANO_MIN, PIANO_MAX, midiToName } from '../utils/note-utils';

export class PianoKeyboard {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pressedKeys: Set<number> = new Set();
  private highlightedKeys: Set<number> = new Set();
  private height: number = 140;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  getHeight(): number {
    return this.height;
  }

  setHeight(h: number) {
    this.height = h;
  }

  pressKey(midi: number) {
    this.pressedKeys.add(midi);
  }

  releaseKey(midi: number) {
    this.pressedKeys.delete(midi);
  }

  setHighlightedKeys(keys: number[]) {
    this.highlightedKeys = new Set(keys);
  }

  clearHighlights() {
    this.highlightedKeys.clear();
  }

  resize() {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  private get width(): number {
    return this.canvas.width / window.devicePixelRatio;
  }

  private countWhiteKeys(from: number, to: number): number {
    let count = 0;
    for (let i = from; i <= to; i++) {
      if (!isBlackKey(i)) count++;
    }
    return count;
  }

  getKeyPosition(midi: number): { x: number; width: number } {
    const totalWhite = this.countWhiteKeys(PIANO_MIN, PIANO_MAX);
    const whiteW = this.width / totalWhite;
    const blackW = whiteW * 0.58;

    if (isBlackKey(midi)) {
      const whitesBefore = this.countWhiteKeys(PIANO_MIN, midi - 1);
      return { x: whitesBefore * whiteW - blackW / 2, width: blackW };
    }
    const whitesBefore = this.countWhiteKeys(PIANO_MIN, midi - 1);
    return { x: whitesBefore * whiteW, width: whiteW };
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const totalWhite = this.countWhiteKeys(PIANO_MIN, PIANO_MAX);
    const whiteW = w / totalWhite;
    const blackW = whiteW * 0.58;
    const blackH = h * 0.6;

    // ===== Draw white keys =====
    let whiteIndex = 0;
    for (let midi = PIANO_MIN; midi <= PIANO_MAX; midi++) {
      if (isBlackKey(midi)) continue;

      const x = whiteIndex * whiteW;
      const pressed = this.pressedKeys.has(midi);
      const highlighted = this.highlightedKeys.has(midi);

      // White key body gradient
      const grad = ctx.createLinearGradient(x, 0, x, h);
      if (pressed) {
        grad.addColorStop(0, '#3BA8D8');
        grad.addColorStop(0.3, '#4FC3F7');
        grad.addColorStop(1, '#2196c9');
      } else if (highlighted) {
        grad.addColorStop(0, '#d0e8f0');
        grad.addColorStop(0.3, '#b8dce8');
        grad.addColorStop(1, '#a0c8d8');
      } else {
        grad.addColorStop(0, '#fafafa');
        grad.addColorStop(0.05, '#f5f5f5');
        grad.addColorStop(0.85, '#ececec');
        grad.addColorStop(1, '#d8d8d8');
      }

      // Draw key shape with slight bottom radius
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + whiteW - 0.5, 0);
      ctx.lineTo(x + whiteW - 0.5, h - r);
      ctx.quadraticCurveTo(x + whiteW - 0.5, h - 0.5, x + whiteW - r, h - 0.5);
      ctx.lineTo(x + r, h - 0.5);
      ctx.quadraticCurveTo(x + 0.5, h - 0.5, x + 0.5, h - r);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      // Key separator line
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + whiteW - 0.5, 0);
      ctx.lineTo(x + whiteW - 0.5, h - 1);
      ctx.stroke();

      // Bottom edge shadow
      if (!pressed) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + 1, h - 4, whiteW - 2, 3);
      }

      // Pressed inset shadow
      if (pressed) {
        const insetGrad = ctx.createLinearGradient(x, 0, x, 8);
        insetGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
        insetGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = insetGrad;
        ctx.fillRect(x + 1, 0, whiteW - 2, 8);

        // Glow
        ctx.shadowColor = '#4FC3F7';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(79, 195, 247, 0.15)';
        ctx.fillRect(x + 2, h - 10, whiteW - 4, 8);
        ctx.shadowBlur = 0;
      }

      // C key labels
      const name = midiToName(midi);
      if (name.startsWith('C') && !name.includes('#')) {
        ctx.fillStyle = pressed ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.3)';
        ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, x + whiteW / 2, h - 8);
      }

      whiteIndex++;
    }

    // ===== Draw black keys =====
    for (let midi = PIANO_MIN; midi <= PIANO_MAX; midi++) {
      if (!isBlackKey(midi)) continue;

      const whitesBefore = this.countWhiteKeys(PIANO_MIN, midi - 1);
      const x = whitesBefore * whiteW - blackW / 2;
      const pressed = this.pressedKeys.has(midi);
      const highlighted = this.highlightedKeys.has(midi);

      const bh = pressed ? blackH + 2 : blackH;

      // Black key body
      const grad = ctx.createLinearGradient(x, 0, x, bh);
      if (pressed) {
        grad.addColorStop(0, '#2196c9');
        grad.addColorStop(0.4, '#4FC3F7');
        grad.addColorStop(1, '#1a7aa8');
      } else if (highlighted) {
        grad.addColorStop(0, '#2a3a4a');
        grad.addColorStop(0.4, '#3a5060');
        grad.addColorStop(1, '#1a2a38');
      } else {
        grad.addColorStop(0, '#2a2a2a');
        grad.addColorStop(0.3, '#222');
        grad.addColorStop(0.7, '#1a1a1a');
        grad.addColorStop(1, '#111');
      }

      // Draw with rounded bottom
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + blackW, 0);
      ctx.lineTo(x + blackW, bh - r);
      ctx.quadraticCurveTo(x + blackW, bh, x + blackW - r, bh);
      ctx.lineTo(x + r, bh);
      ctx.quadraticCurveTo(x, bh, x, bh - r);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      // Side shadows for 3D effect
      if (!pressed) {
        // Left shadow
        const leftShadow = ctx.createLinearGradient(x, 0, x + 3, 0);
        leftShadow.addColorStop(0, 'rgba(0,0,0,0.3)');
        leftShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftShadow;
        ctx.fillRect(x, 0, 3, bh);

        // Right shadow
        const rightShadow = ctx.createLinearGradient(x + blackW - 3, 0, x + blackW, 0);
        rightShadow.addColorStop(0, 'rgba(0,0,0,0)');
        rightShadow.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = rightShadow;
        ctx.fillRect(x + blackW - 3, 0, 3, bh);

        // Top highlight shine
        const shine = ctx.createLinearGradient(x, 0, x, bh * 0.35);
        shine.addColorStop(0, 'rgba(255,255,255,0.1)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0.04)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.roundRect(x + 2, 1, blackW - 4, bh * 0.35, [0, 0, 2, 2]);
        ctx.fill();

        // Bottom face (3D depth)
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.roundRect(x + 1, bh - 3, blackW - 2, 4, [0, 0, r, r]);
        ctx.fill();
      } else {
        // Pressed glow
        ctx.shadowColor = '#4FC3F7';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(79, 195, 247, 0.2)';
        ctx.fillRect(x + 2, bh - 6, blackW - 4, 5);
        ctx.shadowBlur = 0;
      }
    }

    // Bottom border
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, h - 1, w, 1);
  }
}
