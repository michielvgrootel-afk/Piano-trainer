import { db } from './db';
import { StoredSong, NoteSequence } from '../types';

export async function saveSong(
  title: string,
  fileName: string,
  fileType: 'midi' | 'musicxml' | 'pdf',
  noteSequence: NoteSequence
): Promise<number> {
  return (await db.songs.add({
    title,
    fileName,
    fileType,
    noteSequence,
    dateAdded: new Date(),
  })) as number;
}

export async function getAllSongs(): Promise<StoredSong[]> {
  return db.songs.orderBy('dateAdded').reverse().toArray();
}

export async function getSong(id: number): Promise<StoredSong | undefined> {
  return db.songs.get(id);
}

export async function deleteSong(id: number): Promise<void> {
  await db.songs.delete(id);
  // Also delete associated scores
  await db.scores.where('songId').equals(id).delete();
}
