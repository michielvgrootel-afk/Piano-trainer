import { db } from './db';
import { ScoreReport, StoredScore, TutorialProgress } from '../types';

// ===== Song Scores =====

export async function saveScore(songId: number, score: ScoreReport, speed: number): Promise<number> {
  return (await db.scores.add({
    songId,
    score,
    speed,
    datePlayed: new Date(),
  })) as number;
}

export async function getScoresForSong(songId: number): Promise<StoredScore[]> {
  return db.scores.where('songId').equals(songId).reverse().sortBy('datePlayed');
}

export async function getBestScore(songId: number): Promise<StoredScore | undefined> {
  const scores = await getScoresForSong(songId);
  if (scores.length === 0) return undefined;
  return scores.reduce((best, s) => (s.score.accuracy > best.score.accuracy ? s : best));
}

// ===== Tutorial Progress =====

export async function getTutorialProgress(tutorialId: string): Promise<TutorialProgress | undefined> {
  return db.tutorialProgress.get(tutorialId);
}

export async function getAllTutorialProgress(): Promise<TutorialProgress[]> {
  return db.tutorialProgress.toArray();
}

export async function saveTutorialProgress(
  tutorialId: string,
  score: ScoreReport
): Promise<void> {
  const existing = await getTutorialProgress(tutorialId);

  const stars = score.accuracy >= 95 ? 3 : score.accuracy >= 80 ? 2 : score.accuracy >= 60 ? 1 : 0;

  if (existing) {
    const isBetter = !existing.bestScore || score.accuracy > existing.bestScore.accuracy;
    await db.tutorialProgress.update(tutorialId, {
      completed: true,
      bestScore: isBetter ? score : existing.bestScore,
      stars: Math.max(existing.stars, stars),
      attempts: existing.attempts + 1,
    });
  } else {
    await db.tutorialProgress.put({
      tutorialId,
      completed: true,
      bestScore: score,
      stars,
      attempts: 1,
    });
  }
}
