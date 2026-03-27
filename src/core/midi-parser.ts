import { Midi } from '@tonejs/midi';
import { Note, NoteSequence } from '../types';
import { midiToName } from '../utils/note-utils';
import { sortNotes, getSequenceDuration } from './note-sequence';

/**
 * Parse a MIDI file (ArrayBuffer) into our NoteSequence format.
 */
export function parseMidiFile(buffer: ArrayBuffer): NoteSequence {
  const midi = new Midi(buffer);

  const notes: Note[] = [];

  midi.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note) => {
      notes.push({
        midi: note.midi,
        name: midiToName(note.midi),
        startTime: note.time,
        duration: note.duration,
        velocity: Math.round(note.velocity * 127),
        track: trackIndex <= 1 ? trackIndex : 0, // Map first two tracks to right/left hand
      });
    });
  });

  const sorted = sortNotes(notes);

  // Extract tempo
  let tempo = 120;
  if (midi.header.tempos.length > 0) {
    tempo = Math.round(midi.header.tempos[0].bpm);
  }

  // Extract time signature
  let tsNum = 4;
  let tsDen = 4;
  if (midi.header.timeSignatures.length > 0) {
    const ts = midi.header.timeSignatures[0];
    tsNum = ts.timeSignature[0];
    tsDen = ts.timeSignature[1];
  }

  // Extract title
  let title = 'Untitled';
  if (midi.header.name && midi.header.name.trim()) {
    title = midi.header.name.trim();
  }

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
 * Read a File object as ArrayBuffer and parse it as MIDI.
 */
export async function parseMidiFileFromFile(file: File): Promise<NoteSequence> {
  const buffer = await file.arrayBuffer();
  return parseMidiFile(buffer);
}
