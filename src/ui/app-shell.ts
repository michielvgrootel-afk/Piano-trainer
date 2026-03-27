import { MidiDevice, GameConfig } from '../types';

export type Screen = 'home' | 'play' | 'results' | 'tutorials' | 'settings';

export class AppShell {
  private container: HTMLElement;
  private topBar: HTMLElement;
  private mainContent: HTMLElement;
  private currentScreen: Screen = 'home';

  // Top bar elements
  private speedSlider!: HTMLInputElement;
  private speedLabel!: HTMLElement;
  private chordToggle!: HTMLElement;
  private midiDot!: HTMLElement;
  private midiLabel!: HTMLElement;
  private backBtn!: HTMLElement;

  // Callbacks
  onSpeedChange: ((speed: number) => void) | null = null;
  onChordToggle: ((show: boolean) => void) | null = null;
  onBack: (() => void) | null = null;
  onUploadFile: ((file: File) => void) | null = null;
  onStartDemo: (() => void) | null = null;

  private config: GameConfig = {
    speed: 1.0,
    showChords: false,
    hitWindowMs: 200,
    visibleWindow: 3,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.topBar = document.createElement('div');
    this.topBar.className = 'top-bar';
    this.mainContent = document.createElement('div');
    this.mainContent.style.flex = '1';
    this.mainContent.style.display = 'flex';
    this.mainContent.style.flexDirection = 'column';
    this.mainContent.style.overflow = 'hidden';

    this.buildTopBar();
    this.container.appendChild(this.topBar);
    this.container.appendChild(this.mainContent);
  }

  private buildTopBar() {
    // Left section
    const left = document.createElement('div');
    left.className = 'top-bar-left';

    this.backBtn = document.createElement('button');
    this.backBtn.className = 'btn btn-small';
    this.backBtn.textContent = 'Back';
    this.backBtn.style.display = 'none';
    this.backBtn.addEventListener('click', () => this.onBack?.());
    left.appendChild(this.backBtn);

    const title = document.createElement('span');
    title.className = 'app-title';
    title.textContent = 'PIANO TRAINER';
    left.appendChild(title);

    // Right section
    const right = document.createElement('div');
    right.className = 'top-bar-right';

    // Speed control
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    const speedText = document.createElement('span');
    speedText.textContent = 'Speed:';
    this.speedSlider = document.createElement('input');
    this.speedSlider.type = 'range';
    this.speedSlider.min = '0.25';
    this.speedSlider.max = '2.0';
    this.speedSlider.step = '0.25';
    this.speedSlider.value = '1.0';
    this.speedLabel = document.createElement('span');
    this.speedLabel.className = 'speed-value';
    this.speedLabel.textContent = '1.0x';
    this.speedSlider.addEventListener('input', () => {
      const val = parseFloat(this.speedSlider.value);
      this.config.speed = val;
      this.speedLabel.textContent = `${val}x`;
      this.onSpeedChange?.(val);
    });
    speedControl.append(speedText, this.speedSlider, this.speedLabel);
    right.appendChild(speedControl);

    // Chord toggle
    const chordControl = document.createElement('label');
    chordControl.className = 'toggle-control';
    const chordText = document.createElement('span');
    chordText.textContent = 'Chords';
    this.chordToggle = document.createElement('div');
    this.chordToggle.className = 'toggle-switch';
    chordControl.append(chordText, this.chordToggle);
    chordControl.addEventListener('click', () => {
      this.config.showChords = !this.config.showChords;
      this.chordToggle.classList.toggle('active', this.config.showChords);
      this.onChordToggle?.(this.config.showChords);
    });
    right.appendChild(chordControl);

    // MIDI status
    const midiStatus = document.createElement('div');
    midiStatus.className = 'midi-status';
    this.midiDot = document.createElement('div');
    this.midiDot.className = 'midi-dot';
    this.midiLabel = document.createElement('span');
    this.midiLabel.textContent = 'No MIDI';
    midiStatus.append(this.midiDot, this.midiLabel);
    right.appendChild(midiStatus);

    this.topBar.append(left, right);
  }

  getMainContent(): HTMLElement {
    return this.mainContent;
  }

  setMidiStatus(device: MidiDevice | null) {
    if (device && device.connected) {
      this.midiDot.classList.add('connected');
      this.midiLabel.textContent = device.name;
    } else {
      this.midiDot.classList.remove('connected');
      this.midiLabel.textContent = 'No MIDI';
    }
  }

  setScreen(screen: Screen) {
    this.currentScreen = screen;
    this.backBtn.style.display = screen === 'home' ? 'none' : 'inline-block';
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }
}
