import { injectStyles } from './ui/styles';
import { AppShell } from './ui/app-shell';
import { CanvasRenderer } from './visualization/canvas-renderer';
import { PianoKeyboard } from './visualization/piano-keyboard';
import { midiAccess } from './core/midi-access';
import { clock } from './core/timing';
import { audioEngine } from './core/audio-engine';
import { parseMidiFileFromFile } from './core/midi-parser';
import { parseMusicXmlFromFile, parseMxlFromFile } from './core/musicxml-parser';
import { convertPdfToNoteSequence, isOmrAvailable } from './core/omr-bridge';
import { GameEngine } from './game/game-engine';
import { detectChord } from './utils/chord-detector';
import { getAllTutorials, getTutorialsByLevel, getTutorialLevels, getTutorial } from './data/tutorial-loader';
import { getAllTutorialProgress, saveTutorialProgress } from './data/progress-store';
import { saveSong, getAllSongs } from './data/song-store';
import { Note, NoteSequence, ScoreReport, GameState, TutorialProgress } from './types';
import { midiToName } from './utils/note-utils';

// ===== Inject CSS =====
injectStyles();

// ===== App Shell =====
const appEl = document.getElementById('app')!;
const shell = new AppShell(appEl);
const main = shell.getMainContent();

// ===== State =====
let gameState: GameState = 'idle';
let animationId = 0;
let currentNotes: Note[] = [];
let currentTitle: string = 'Demo Song';
let lastReport: ScoreReport | null = null;

// ===== Build Home Screen =====
function showHomeScreen() {
  gameState = 'idle';
  shell.setScreen('home');
  main.innerHTML = '';
  audioEngine.stop();

  const home = document.createElement('div');
  home.className = 'home-screen';

  const title = document.createElement('h1');
  title.className = 'home-title';
  title.textContent = 'PIANO TRAINER';

  const subtitle = document.createElement('p');
  subtitle.className = 'home-subtitle';
  subtitle.textContent = 'Connect your MIDI keyboard and start playing. Upload MIDI, MusicXML, or PDF sheet music and learn with Guitar Hero-style falling notes.';

  // File drop zone
  const dropZone = document.createElement('div');
  dropZone.className = 'drop-zone';
  const dropText = document.createElement('div');
  dropText.className = 'drop-zone-text';
  dropText.textContent = 'Drop a file here or click to upload';
  const dropFormats = document.createElement('div');
  dropFormats.className = 'drop-zone-formats';
  dropFormats.textContent = 'Supports: .mid, .midi, .musicxml, .mxl, .xml, .pdf';
  dropZone.append(dropText, dropFormats);

  const loadingText = document.createElement('div');
  loadingText.className = 'drop-zone-text';
  loadingText.style.display = 'none';
  loadingText.style.color = '#4FC3F7';
  loadingText.textContent = 'Parsing file...';
  dropZone.appendChild(loadingText);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.mid,.midi,.musicxml,.mxl,.xml,.pdf';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) {
      handleFileUpload(fileInput.files[0], dropText, loadingText);
    }
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer?.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], dropText, loadingText);
    }
  });

  const actions = document.createElement('div');
  actions.className = 'home-actions';
  const demoBtn = document.createElement('button');
  demoBtn.className = 'btn btn-primary';
  demoBtn.textContent = 'Play Demo Song';
  demoBtn.addEventListener('click', () => {
    currentTitle = 'Twinkle Twinkle Little Star';
    activeTutorialId = null;
    startPlayScreen(generateDemoSong());
  });

  const tutorialBtn = document.createElement('button');
  tutorialBtn.className = 'btn';
  tutorialBtn.textContent = 'Tutorials';
  tutorialBtn.addEventListener('click', showTutorialsScreen);

  actions.append(demoBtn, tutorialBtn);

  home.append(title, subtitle, dropZone, fileInput, actions);
  main.appendChild(home);

  // Load and display saved songs
  getAllSongs().then((songs) => {
    if (songs.length === 0) return;

    const libraryHeader = document.createElement('h3');
    libraryHeader.style.cssText = 'color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;';
    libraryHeader.textContent = 'Song Library';

    const songList = document.createElement('div');
    songList.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; max-width: 500px; width: 100%;';

    for (const song of songs) {
      const songBtn = document.createElement('button');
      songBtn.className = 'btn';
      songBtn.textContent = song.title;
      songBtn.addEventListener('click', () => {
        currentTitle = song.title;
        activeTutorialId = null;
        startPlayScreen(song.noteSequence.notes);
      });
      songList.appendChild(songBtn);
    }

    home.append(libraryHeader, songList);
  });
}

// ===== File Upload Handler =====
async function handleFileUpload(file: File, dropText: HTMLElement, loadingText: HTMLElement) {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'mid' || ext === 'midi') {
    dropText.style.display = 'none';
    loadingText.style.display = 'block';
    loadingText.textContent = `Parsing ${file.name}...`;

    try {
      const sequence = await parseMidiFileFromFile(file);
      currentTitle = sequence.title !== 'Untitled' ? sequence.title : file.name.replace(/\.[^.]+$/, '');
      activeTutorialId = null;
      await saveSong(currentTitle, file.name, 'midi', sequence).catch(() => {});
      startPlayScreen(sequence.notes);
    } catch (err) {
      console.error('Failed to parse MIDI file:', err);
      loadingText.textContent = `Error: Could not parse ${file.name}`;
      loadingText.style.color = '#FF4444';
      setTimeout(() => {
        dropText.style.display = 'block';
        loadingText.style.display = 'none';
        loadingText.style.color = '#4FC3F7';
      }, 3000);
    }
  } else if (ext === 'musicxml' || ext === 'xml' || ext === 'mxl') {
    dropText.style.display = 'none';
    loadingText.style.display = 'block';
    loadingText.textContent = `Parsing ${file.name}...`;

    try {
      const sequence = ext === 'mxl'
        ? await parseMxlFromFile(file)
        : await parseMusicXmlFromFile(file);
      currentTitle = sequence.title !== 'Untitled' ? sequence.title : file.name.replace(/\.[^.]+$/, '');
      activeTutorialId = null;
      await saveSong(currentTitle, file.name, 'musicxml', sequence).catch(() => {});
      startPlayScreen(sequence.notes);
    } catch (err) {
      console.error('Failed to parse MusicXML file:', err);
      loadingText.textContent = `Error: Could not parse ${file.name}`;
      loadingText.style.color = '#FF4444';
      setTimeout(() => {
        dropText.style.display = 'block';
        loadingText.style.display = 'none';
        loadingText.style.color = '#4FC3F7';
      }, 3000);
    }
  } else if (ext === 'pdf' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    if (!isOmrAvailable()) {
      dropText.textContent = 'PDF conversion requires the desktop app with Audiveris installed.';
      setTimeout(() => { dropText.textContent = 'Drop a file here or click to upload'; }, 4000);
      return;
    }

    dropText.style.display = 'none';
    loadingText.style.display = 'block';
    loadingText.textContent = `Converting ${file.name} via OMR (this may take 10-30s)...`;

    try {
      const sequence = await convertPdfToNoteSequence(file);
      currentTitle = sequence.title;
      activeTutorialId = null;
      startPlayScreen(sequence.notes);
    } catch (err: any) {
      console.error('OMR conversion failed:', err);
      loadingText.textContent = `Error: ${err.message || 'OMR conversion failed'}`;
      loadingText.style.color = '#FF4444';
      setTimeout(() => {
        dropText.style.display = 'block';
        loadingText.style.display = 'none';
        loadingText.style.color = '#4FC3F7';
      }, 5000);
    }
  } else {
    dropText.textContent = `Unsupported format: .${ext}`;
    setTimeout(() => { dropText.textContent = 'Drop a file here or click to upload'; }, 3000);
  }
}

// ===== Countdown =====
function showCountdown(container: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    container.appendChild(overlay);

    let count = 3;
    const numEl = document.createElement('div');
    numEl.className = 'countdown-number';
    numEl.textContent = String(count);
    overlay.appendChild(numEl);

    const tick = () => {
      count--;
      if (count > 0) {
        numEl.textContent = String(count);
        numEl.style.animation = 'none';
        numEl.offsetHeight;
        numEl.style.animation = 'countPulse 0.5s ease-out';
        setTimeout(tick, 800);
      } else {
        numEl.textContent = 'GO!';
        numEl.style.animation = 'none';
        numEl.offsetHeight;
        numEl.style.animation = 'countPulse 0.5s ease-out';
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 500);
      }
    };

    setTimeout(tick, 800);
  });
}

// ===== Play Screen =====
async function startPlayScreen(notes: Note[]) {
  gameState = 'countdown';
  shell.setScreen('play');
  main.innerHTML = '';
  currentNotes = notes;

  await audioEngine.initialize();

  // Sheet music section (placeholder for Phase 4)
  const sheetSection = document.createElement('div');
  sheetSection.className = 'sheet-music-section';
  const placeholder = document.createElement('div');
  placeholder.className = 'sheet-music-placeholder';
  placeholder.textContent = 'Sheet music will appear here when MusicXML files are loaded';
  sheetSection.appendChild(placeholder);

  // Falling notes canvas
  const fallingSection = document.createElement('div');
  fallingSection.className = 'falling-notes-section';
  const fallingCanvas = document.createElement('canvas');
  fallingSection.appendChild(fallingCanvas);

  // Combo display (overlaid on falling notes)
  const comboDisplay = document.createElement('div');
  comboDisplay.className = 'combo-display';
  comboDisplay.style.display = 'none';
  fallingSection.appendChild(comboDisplay);

  // Chord display (overlaid on falling notes)
  const chordEl = document.createElement('div');
  chordEl.className = 'chord-display';
  chordEl.style.display = 'none';
  fallingSection.appendChild(chordEl);

  // Piano keyboard
  const pianoSection = document.createElement('div');
  pianoSection.className = 'piano-section';
  const pianoCanvas = document.createElement('canvas');
  pianoSection.appendChild(pianoCanvas);

  main.append(sheetSection, fallingSection, pianoSection);

  // Initialize renderers
  const keyboard = new PianoKeyboard(pianoCanvas);
  const renderer = new CanvasRenderer(fallingCanvas);

  renderer.setNotes(notes);
  renderer.setKeyboardHeight(keyboard.getHeight());

  // Resize
  const resize = () => {
    keyboard.resize();
    renderer.setKeyboardHeight(keyboard.getHeight());
    renderer.resize();
  };
  window.addEventListener('resize', resize);
  requestAnimationFrame(resize);

  // Game engine
  const config = shell.getConfig();
  const game = new GameEngine(clock);
  game.setup(notes, config);

  // Game engine callbacks -> visualization
  game.onNoteHit = (hit) => {
    renderer.markHit(hit.note);
  };

  game.onNoteMiss = (note) => {
    renderer.markMissed(note);
  };

  game.onComboChange = (combo) => {
    if (combo >= 5) {
      comboDisplay.textContent = `${combo} Combo!`;
      comboDisplay.style.display = 'block';
      comboDisplay.style.animation = 'none';
      comboDisplay.offsetHeight; // trigger reflow
      comboDisplay.style.animation = 'comboFlash 0.3s ease-out';
    } else {
      comboDisplay.style.display = 'none';
    }
  };

  game.onFinish = async (report) => {
    lastReport = report;
    gameState = 'finished';
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    removeMidiListener();
    clock.pause();
    audioEngine.stop();

    // Save tutorial progress if applicable
    if (activeTutorialId) {
      await saveTutorialProgress(activeTutorialId, report);
    }

    showResultsScreen();
  };

  // MIDI input -> keyboard + game engine + audio
  const removeMidiListener = midiAccess.onNote((event) => {
    if (event.type === 'noteon') {
      keyboard.pressKey(event.note);
      audioEngine.playNote(event.note, event.velocity);
      game.processInput(event.note);
    } else {
      keyboard.releaseKey(event.note);
    }
  });

  // Setup timing
  clock.reset(2);
  clock.setSpeed(config.speed);

  // Audio
  audioEngine.scheduleNotes(notes, config.speed, 2);

  // Speed control
  shell.onSpeedChange = (s) => {
    const currentTime = clock.currentTime;
    clock.setSpeed(s);
    audioEngine.stop();
    // Reschedule only notes that haven't been played yet
    const remainingNotes = notes.filter(n => n.startTime > currentTime);
    const offset = currentTime > 0 ? 0 : -currentTime / s;
    audioEngine.scheduleNotes(remainingNotes, s, offset);
    audioEngine.play();
  };

  // Back button
  shell.onBack = () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    removeMidiListener();
    clock.pause();
    audioEngine.stop();
    showHomeScreen();
  };

  // Render one frame immediately so the user sees the keyboard during countdown
  requestAnimationFrame(() => {
    resize();
    renderer.render(-3);
    keyboard.render();
  });

  // Countdown then start
  await showCountdown(main);

  gameState = 'playing';
  clock.start();
  audioEngine.play();
  game.start();

  // Pointer for efficient active-note scanning (notes are sorted by startTime)
  let highlightPointer = 0;

  function highlightActiveNotes(time: number) {
    // Advance pointer past notes that have ended
    while (highlightPointer > 0 && notes[highlightPointer - 1].startTime > time) {
      highlightPointer--;
    }

    const activeMidis: number[] = [];
    for (let i = highlightPointer; i < notes.length; i++) {
      const n = notes[i];
      if (n.startTime > time) break; // sorted, so no more can be active
      if (time <= n.startTime + n.duration) {
        activeMidis.push(n.midi);
      }
    }
    // Advance pointer past notes whose end time has passed
    while (highlightPointer < notes.length && notes[highlightPointer].startTime + notes[highlightPointer].duration < time) {
      highlightPointer++;
    }

    keyboard.setHighlightedKeys(activeMidis);

    // Chord detection
    if (shell.getConfig().showChords && activeMidis.length >= 3) {
      const chord = detectChord(activeMidis);
      if (chord) {
        chordEl.textContent = chord;
        chordEl.style.display = 'block';
      } else {
        chordEl.style.display = 'none';
      }
    } else {
      chordEl.style.display = 'none';
    }
  }

  function gameLoop() {
    clock.update();
    const time = clock.currentTime;

    game.update();
    renderer.setConfig({ speed: clock.speed, visibleWindow: 3 });
    renderer.render(time);
    highlightActiveNotes(time);
    keyboard.render();

    animationId = requestAnimationFrame(gameLoop);
  }

  animationId = requestAnimationFrame(gameLoop);
}

// ===== Tutorials Screen =====
async function showTutorialsScreen() {
  shell.setScreen('tutorials');
  main.innerHTML = '';

  shell.onBack = showHomeScreen;

  const container = document.createElement('div');
  container.style.cssText = 'padding: 24px; overflow-y: auto; height: 100%;';

  const title = document.createElement('h2');
  title.style.cssText = 'color: #4FC3F7; margin-bottom: 20px; font-size: 24px;';
  title.textContent = 'Tutorials';
  container.appendChild(title);

  const progress = await getAllTutorialProgress();
  const progressMap = new Map<string, TutorialProgress>();
  progress.forEach((p) => progressMap.set(p.tutorialId, p));

  const levels = getTutorialLevels();
  const levelNames = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

  for (const level of levels) {
    const levelHeader = document.createElement('h3');
    levelHeader.style.cssText = 'color: #888; margin: 16px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;';
    levelHeader.textContent = `Level ${level} — ${levelNames[level] || ''}`;
    container.appendChild(levelHeader);

    const tutorials = getTutorialsByLevel(level);
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin-bottom: 16px;';

    for (const tut of tutorials) {
      const prog = progressMap.get(tut.id);
      const isUnlocked = tut.prerequisiteIds.every((id) => {
        const p = progressMap.get(id);
        return p && p.completed;
      });

      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isUnlocked ? '#16162a' : '#111122'};
        border: 1px solid ${prog?.completed ? '#4FC3F7' : '#2a2a4a'};
        border-radius: 8px;
        padding: 14px;
        cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
        opacity: ${isUnlocked ? '1' : '0.5'};
        transition: border-color 0.15s;
      `;

      if (isUnlocked) {
        card.addEventListener('mouseenter', () => { card.style.borderColor = '#4FC3F7'; });
        card.addEventListener('mouseleave', () => { card.style.borderColor = prog?.completed ? '#4FC3F7' : '#2a2a4a'; });
        card.addEventListener('click', () => {
          currentTitle = tut.title;
          activeTutorialId = tut.id;
          startPlayScreen(tut.notes);
        });
      }

      const cardTitle = document.createElement('div');
      cardTitle.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px;';
      cardTitle.textContent = tut.title;

      const cardDesc = document.createElement('div');
      cardDesc.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 8px;';
      cardDesc.textContent = tut.description;

      const cardStars = document.createElement('div');
      cardStars.style.cssText = 'font-size: 16px;';
      const stars = prog?.stars || 0;
      cardStars.textContent = (stars >= 1 ? '\u2605' : '\u2606') + (stars >= 2 ? '\u2605' : '\u2606') + (stars >= 3 ? '\u2605' : '\u2606');
      cardStars.style.color = stars > 0 ? '#FFD700' : '#555';

      card.append(cardTitle, cardDesc, cardStars);
      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  main.appendChild(container);
}

let activeTutorialId: string | null = null;

// ===== Results Screen =====
function showResultsScreen() {
  shell.setScreen('results');
  main.innerHTML = '';

  const report = lastReport || {
    perfect: 0, good: 0, miss: currentNotes.length, wrong: 0,
    totalNotes: currentNotes.length, accuracy: 0, maxCombo: 0, grade: 'F' as const,
  };

  const results = document.createElement('div');
  results.className = 'results-screen';

  // Grade
  const grade = document.createElement('div');
  grade.className = `results-grade grade-${report.grade}`;
  grade.textContent = report.grade;

  // Song title
  const songTitle = document.createElement('h2');
  songTitle.style.color = '#ccc';
  songTitle.style.fontSize = '20px';
  songTitle.style.marginBottom = '4px';
  songTitle.textContent = currentTitle;

  // Accuracy
  const accuracy = document.createElement('div');
  accuracy.style.fontSize = '28px';
  accuracy.style.fontWeight = '700';
  accuracy.style.color = '#4FC3F7';
  accuracy.textContent = `${report.accuracy}%`;

  // Stats grid
  const stats = document.createElement('div');
  stats.className = 'results-stats';

  const statItems = [
    ['Perfect', `${report.perfect}`, '#FFD700'],
    ['Good', `${report.good}`, '#4FC3F7'],
    ['Missed', `${report.miss}`, '#FF4444'],
    ['Wrong', `${report.wrong}`, '#FF6B6B'],
    ['Max Combo', `${report.maxCombo}`, '#81C784'],
    ['Total Notes', `${report.totalNotes}`, '#888'],
  ];

  for (const [label, value, color] of statItems) {
    const labelEl = document.createElement('div');
    labelEl.className = 'results-stat-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('div');
    valueEl.className = 'results-stat-value';
    valueEl.style.color = color;
    valueEl.textContent = value;
    stats.append(labelEl, valueEl);
  }

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '12px';
  btnRow.style.marginTop = '20px';

  const againBtn = document.createElement('button');
  againBtn.className = 'btn btn-primary';
  againBtn.textContent = 'Play Again';
  againBtn.addEventListener('click', () => startPlayScreen(currentNotes));

  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn';
  homeBtn.textContent = 'Home';
  homeBtn.addEventListener('click', showHomeScreen);

  btnRow.append(againBtn, homeBtn);
  results.append(grade, songTitle, accuracy, stats, btnRow);
  main.appendChild(results);
}

// ===== Demo Song Generator =====
function generateDemoSong(): Note[] {
  const melody = [
    { note: 60, time: 0, dur: 0.4 },
    { note: 60, time: 0.5, dur: 0.4 },
    { note: 67, time: 1.0, dur: 0.4 },
    { note: 67, time: 1.5, dur: 0.4 },
    { note: 69, time: 2.0, dur: 0.4 },
    { note: 69, time: 2.5, dur: 0.4 },
    { note: 67, time: 3.0, dur: 0.9 },
    { note: 65, time: 4.0, dur: 0.4 },
    { note: 65, time: 4.5, dur: 0.4 },
    { note: 64, time: 5.0, dur: 0.4 },
    { note: 64, time: 5.5, dur: 0.4 },
    { note: 62, time: 6.0, dur: 0.4 },
    { note: 62, time: 6.5, dur: 0.4 },
    { note: 60, time: 7.0, dur: 0.9 },
    { note: 67, time: 8.0, dur: 0.4 },
    { note: 67, time: 8.5, dur: 0.4 },
    { note: 65, time: 9.0, dur: 0.4 },
    { note: 65, time: 9.5, dur: 0.4 },
    { note: 64, time: 10.0, dur: 0.4 },
    { note: 64, time: 10.5, dur: 0.4 },
    { note: 62, time: 11.0, dur: 0.9 },
    { note: 67, time: 12.0, dur: 0.4 },
    { note: 67, time: 12.5, dur: 0.4 },
    { note: 65, time: 13.0, dur: 0.4 },
    { note: 65, time: 13.5, dur: 0.4 },
    { note: 64, time: 14.0, dur: 0.4 },
    { note: 64, time: 14.5, dur: 0.4 },
    { note: 62, time: 15.0, dur: 0.9 },
    { note: 60, time: 16.0, dur: 0.4 },
    { note: 60, time: 16.5, dur: 0.4 },
    { note: 67, time: 17.0, dur: 0.4 },
    { note: 67, time: 17.5, dur: 0.4 },
    { note: 69, time: 18.0, dur: 0.4 },
    { note: 69, time: 18.5, dur: 0.4 },
    { note: 67, time: 19.0, dur: 0.9 },
    { note: 65, time: 20.0, dur: 0.4 },
    { note: 65, time: 20.5, dur: 0.4 },
    { note: 64, time: 21.0, dur: 0.4 },
    { note: 64, time: 21.5, dur: 0.4 },
    { note: 62, time: 22.0, dur: 0.4 },
    { note: 62, time: 22.5, dur: 0.4 },
    { note: 60, time: 23.0, dur: 0.9 },
  ];

  return melody.map((m) => ({
    midi: m.note,
    name: midiToName(m.note),
    startTime: m.time,
    duration: m.dur,
    velocity: 80,
    track: 0,
  }));
}

// ===== Initialize =====
async function init() {
  const midiReady = await midiAccess.initialize();
  if (midiReady) {
    midiAccess.onDeviceChange(() => {
      const active = midiAccess.getActiveDevice();
      shell.setMidiStatus(active);
    });
  }

  showHomeScreen();
}

init();
