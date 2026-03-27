import { ScoreReport, Grade, HitResult, NoteHit } from '../types';

/**
 * Tracks score throughout a gameplay session.
 */
export class ScoreTracker {
  private perfect = 0;
  private good = 0;
  private miss = 0;
  private wrong = 0;
  private totalNotes = 0;
  private combo = 0;
  private maxCombo = 0;

  /** Current combo streak */
  get currentCombo(): number {
    return this.combo;
  }

  reset(totalNotes: number) {
    this.perfect = 0;
    this.good = 0;
    this.miss = 0;
    this.wrong = 0;
    this.totalNotes = totalNotes;
    this.combo = 0;
    this.maxCombo = 0;
  }

  recordHit(hit: NoteHit) {
    if (hit.result === 'perfect') {
      this.perfect++;
    } else if (hit.result === 'good') {
      this.good++;
    }
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
  }

  recordMiss() {
    this.miss++;
    this.combo = 0;
  }

  recordWrong() {
    this.wrong++;
    this.combo = 0;
  }

  getReport(): ScoreReport {
    const hit = this.perfect + this.good;
    const accuracy = this.totalNotes > 0 ? (hit / this.totalNotes) * 100 : 0;

    return {
      perfect: this.perfect,
      good: this.good,
      miss: this.miss,
      wrong: this.wrong,
      totalNotes: this.totalNotes,
      accuracy: Math.round(accuracy * 10) / 10,
      maxCombo: this.maxCombo,
      grade: this.calculateGrade(accuracy),
    };
  }

  private calculateGrade(accuracy: number): Grade {
    if (accuracy >= 95) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    if (accuracy >= 55) return 'C';
    if (accuracy >= 40) return 'D';
    return 'F';
  }
}
