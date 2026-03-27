import Dexie, { type EntityTable } from 'dexie';
import { StoredSong, StoredScore, TutorialProgress } from '../types';

class PianoTrainerDB extends Dexie {
  songs!: EntityTable<StoredSong, 'id'>;
  scores!: EntityTable<StoredScore, 'id'>;
  tutorialProgress!: EntityTable<TutorialProgress, 'tutorialId'>;

  constructor() {
    super('PianoTrainerDB');

    this.version(1).stores({
      songs: '++id, title, fileName, dateAdded',
      scores: '++id, songId, datePlayed',
      tutorialProgress: 'tutorialId, completed, stars',
    });
  }
}

export const db = new PianoTrainerDB();
