import { Note, NoteSequence } from '../types';
import { midiToName } from '../utils/note-utils';
import { sortNotes, getSequenceDuration } from './note-sequence';

/**
 * Parse a MusicXML string into a NoteSequence.
 * Handles both partwise and timewise MusicXML formats.
 */
export function parseMusicXml(xmlString: string): NoteSequence {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid MusicXML: ' + parseError.textContent);
  }

  // Detect format
  const root = doc.documentElement;
  const isPartwise = root.tagName === 'score-partwise';

  if (!isPartwise && root.tagName !== 'score-timewise') {
    throw new Error('Unsupported MusicXML root element: ' + root.tagName);
  }

  // Get title
  const titleEl = doc.querySelector('movement-title') || doc.querySelector('work-title');
  const title = titleEl?.textContent?.trim() || 'Untitled';

  // Default tempo
  let tempo = 120;
  const soundEl = doc.querySelector('sound[tempo]');
  if (soundEl) {
    tempo = parseFloat(soundEl.getAttribute('tempo')!) || 120;
  }

  // Time signature
  let tsNum = 4;
  let tsDen = 4;
  const tsEl = doc.querySelector('time');
  if (tsEl) {
    const beats = tsEl.querySelector('beats');
    const beatType = tsEl.querySelector('beat-type');
    if (beats) tsNum = parseInt(beats.textContent!) || 4;
    if (beatType) tsDen = parseInt(beatType.textContent!) || 4;
  }

  // Divisions (ticks per quarter note)
  let divisions = 1;
  const divEl = doc.querySelector('attributes divisions');
  if (divEl) {
    divisions = parseInt(divEl.textContent!) || 1;
  }

  const notes: Note[] = [];
  const parts = doc.querySelectorAll('part');

  parts.forEach((part, trackIndex) => {
    let currentTime = 0; // in quarter-note beats

    const measures = part.querySelectorAll('measure');
    measures.forEach((measure) => {
      // Check for divisions change within measure
      const measureDiv = measure.querySelector('attributes divisions');
      if (measureDiv) {
        divisions = parseInt(measureDiv.textContent!) || divisions;
      }

      // Check for tempo change
      const measureSound = measure.querySelector('sound[tempo]');
      if (measureSound) {
        tempo = parseFloat(measureSound.getAttribute('tempo')!) || tempo;
      }

      const elements = measure.children;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        if (el.tagName === 'forward') {
          const dur = parseInt(el.querySelector('duration')?.textContent || '0');
          currentTime += dur / divisions;
        } else if (el.tagName === 'backup') {
          const dur = parseInt(el.querySelector('duration')?.textContent || '0');
          currentTime -= dur / divisions;
        } else if (el.tagName === 'note') {
          const isRest = el.querySelector('rest') !== null;
          const isChord = el.querySelector('chord') !== null;
          const durationEl = el.querySelector('duration');
          const duration = durationEl ? parseInt(durationEl.textContent!) / divisions : 1;

          if (!isRest) {
            const pitch = el.querySelector('pitch');
            if (pitch) {
              const step = pitch.querySelector('step')?.textContent || 'C';
              const alter = parseInt(pitch.querySelector('alter')?.textContent || '0');
              const octave = parseInt(pitch.querySelector('octave')?.textContent || '4');

              const midi = pitchToMidi(step, alter, octave);
              const startTimeSec = (currentTime * 60) / tempo;
              const durationSec = (duration * 60) / tempo;

              notes.push({
                midi,
                name: midiToName(midi),
                startTime: startTimeSec,
                duration: durationSec,
                velocity: 80,
                track: Math.min(trackIndex, 1), // 0 = right hand, 1 = left hand
              });
            }
          }

          if (!isChord) {
            currentTime += duration;
          }
        }
      }
    });
  });

  const sorted = sortNotes(notes);

  return {
    notes: sorted,
    duration: getSequenceDuration(sorted),
    tempo,
    timeSignatureNumerator: tsNum,
    timeSignatureDenominator: tsDen,
    title,
  };
}

/**
 * Convert MusicXML pitch (step, alter, octave) to MIDI note number.
 */
function pitchToMidi(step: string, alter: number, octave: number): number {
  const stepMap: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  const base = stepMap[step] ?? 0;
  return (octave + 1) * 12 + base + alter;
}

/**
 * Read a File object and parse it as MusicXML.
 */
export async function parseMusicXmlFromFile(file: File): Promise<NoteSequence> {
  const text = await file.text();
  return parseMusicXml(text);
}
