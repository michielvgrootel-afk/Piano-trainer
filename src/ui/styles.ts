export function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #0d0d1a;
      color: #e0e0e0;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }

    #app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }

    /* ===== Top Bar ===== */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #16162a;
      border-bottom: 1px solid #2a2a4a;
      height: 48px;
      flex-shrink: 0;
      z-index: 10;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .app-title {
      font-size: 16px;
      font-weight: 700;
      color: #4FC3F7;
      letter-spacing: 1px;
    }

    /* ===== Buttons ===== */
    .btn {
      background: #2a2a4a;
      color: #e0e0e0;
      border: 1px solid #3a3a5a;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn:hover {
      background: #3a3a5a;
      border-color: #4FC3F7;
    }

    .btn-primary {
      background: #4FC3F7;
      color: #0d0d1a;
      border-color: #4FC3F7;
      font-weight: 600;
    }

    .btn-primary:hover {
      background: #81D4FA;
    }

    .btn-small {
      padding: 4px 10px;
      font-size: 12px;
    }

    /* ===== Sheet Music Section ===== */
    .sheet-music-section {
      height: 25%;
      min-height: 120px;
      background: #12122a;
      border-bottom: 1px solid #2a2a4a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .sheet-music-placeholder {
      color: #555;
      font-size: 14px;
      text-align: center;
    }

    /* ===== Falling Notes Section ===== */
    .falling-notes-section {
      flex: 1;
      position: relative;
      min-height: 200px;
    }

    .falling-notes-section canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* ===== Playback Controls ===== */
    .playback-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #16162a;
      border-top: 1px solid #2a2a4a;
      border-bottom: 1px solid #2a2a4a;
      flex-shrink: 0;
      height: 40px;
      z-index: 5;
    }

    .playback-btn {
      min-width: 36px;
      text-align: center;
      font-size: 14px;
      padding: 4px 8px;
    }

    .time-display {
      font-size: 12px;
      color: #aaa;
      font-variant-numeric: tabular-nums;
      min-width: 90px;
      text-align: center;
      flex-shrink: 0;
    }

    .progress-container {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 4px;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: #2a2a4a;
      border-radius: 3px;
      position: relative;
      cursor: pointer;
    }

    .progress-bar:hover {
      height: 8px;
    }

    .progress-fill {
      height: 100%;
      background: #4FC3F7;
      border-radius: 3px;
      width: 0%;
      pointer-events: none;
      transition: none;
    }

    .progress-handle {
      position: absolute;
      top: 50%;
      left: 0%;
      width: 14px;
      height: 14px;
      background: #4FC3F7;
      border: 2px solid #fff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .progress-bar:hover .progress-handle,
    .progress-handle.active {
      opacity: 1;
    }

    /* ===== Piano Keyboard Section ===== */
    .piano-section {
      flex-shrink: 0;
      position: relative;
    }

    .piano-section canvas {
      display: block;
    }

    /* ===== Controls ===== */
    .speed-control {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .speed-control input[type="range"] {
      width: 100px;
      accent-color: #4FC3F7;
    }

    .speed-value {
      color: #4FC3F7;
      font-weight: 600;
      min-width: 36px;
      text-align: center;
    }

    /* ===== Toggle ===== */
    .toggle-control {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .toggle-switch {
      width: 36px;
      height: 20px;
      background: #2a2a4a;
      border-radius: 10px;
      position: relative;
      transition: background 0.2s;
      border: 1px solid #3a3a5a;
    }

    .toggle-switch.active {
      background: #4FC3F7;
      border-color: #4FC3F7;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      top: 1px;
      left: 1px;
      transition: transform 0.2s;
    }

    .toggle-switch.active::after {
      transform: translateX(16px);
    }

    /* ===== MIDI Status ===== */
    .midi-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .midi-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FF4444;
    }

    .midi-dot.connected {
      background: #4CAF50;
      box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
    }

    /* ===== Home Screen ===== */
    .home-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 24px;
      padding: 32px;
    }

    .home-title {
      font-size: 48px;
      font-weight: 800;
      background: linear-gradient(135deg, #4FC3F7, #81C784);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 2px;
    }

    .home-subtitle {
      font-size: 16px;
      color: #888;
      max-width: 500px;
      text-align: center;
      line-height: 1.5;
    }

    .home-actions {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .home-actions .btn {
      padding: 12px 28px;
      font-size: 15px;
      border-radius: 8px;
    }

    /* ===== Upload Drop Zone ===== */
    .drop-zone {
      border: 2px dashed #3a3a5a;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      max-width: 500px;
      width: 100%;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      border-color: #4FC3F7;
      background: rgba(79, 195, 247, 0.05);
    }

    .drop-zone-text {
      color: #888;
      font-size: 14px;
    }

    .drop-zone-formats {
      color: #555;
      font-size: 12px;
      margin-top: 8px;
    }

    /* ===== Results Screen ===== */
    .results-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 20px;
      padding: 32px;
    }

    .results-grade {
      font-size: 96px;
      font-weight: 900;
      line-height: 1;
    }

    .results-grade.grade-S { color: #FFD700; }
    .results-grade.grade-A { color: #4FC3F7; }
    .results-grade.grade-B { color: #81C784; }
    .results-grade.grade-C { color: #FFA726; }
    .results-grade.grade-D { color: #EF5350; }
    .results-grade.grade-F { color: #B71C1C; }

    .results-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 32px;
      font-size: 16px;
    }

    .results-stat-label {
      color: #888;
      text-align: right;
    }

    .results-stat-value {
      font-weight: 600;
    }

    /* ===== Countdown ===== */
    .countdown-overlay {
      position: absolute;
      inset: 0;
      background: rgba(13, 13, 26, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .countdown-number {
      font-size: 120px;
      font-weight: 900;
      color: #4FC3F7;
      animation: countPulse 0.5s ease-out;
    }

    @keyframes countPulse {
      from { transform: scale(1.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* ===== Chord Display ===== */
    .chord-display {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(22, 22, 42, 0.9);
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 700;
      color: #FFD700;
      border: 1px solid #3a3a5a;
      z-index: 5;
    }

    /* ===== Combo Display ===== */
    .combo-display {
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 24px;
      font-weight: 800;
      color: #FFD700;
      text-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
      z-index: 5;
      pointer-events: none;
    }

    @keyframes comboFlash {
      from { transform: scale(1.3); opacity: 0.7; }
      to { transform: scale(1); opacity: 1; }
    }

    /* ===== Scrollbar ===== */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #0d0d1a;
    }

    ::-webkit-scrollbar-thumb {
      background: #3a3a5a;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);
}
