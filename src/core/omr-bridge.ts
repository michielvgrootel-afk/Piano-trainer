import { NoteSequence } from '../types';
import { parseMusicXml } from './musicxml-parser';

/**
 * Convert a PDF/image file to a NoteSequence via Audiveris OMR.
 * Requires Electron (uses IPC to the main process).
 *
 * Flow: File -> ArrayBuffer -> IPC to main -> Audiveris CLI -> MusicXML string -> parse -> NoteSequence
 */
export async function convertPdfToNoteSequence(file: File): Promise<NoteSequence> {
  if (!window.electronAPI?.convertPdfToMusicXml) {
    throw new Error(
      'PDF conversion requires the Electron desktop app with Audiveris installed. ' +
      'Please use the desktop app or upload a .mid or .musicxml file instead.'
    );
  }

  const buffer = await file.arrayBuffer();
  const musicXmlString = await window.electronAPI.convertPdfToMusicXml(buffer, file.name);

  // Parse the MusicXML output
  const sequence = parseMusicXml(musicXmlString);

  // Use the original file name as the title if no title was found
  if (sequence.title === 'Untitled') {
    sequence.title = file.name.replace(/\.[^.]+$/, '');
  }

  return sequence;
}

/**
 * Check if OMR/PDF conversion is available.
 */
export function isOmrAvailable(): boolean {
  return !!window.electronAPI?.convertPdfToMusicXml;
}
