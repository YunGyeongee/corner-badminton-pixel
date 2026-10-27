import type { Side } from './types';

export interface ScoreRules {
  pointsToWin: number;
  winBy: number;
  /** Whoever reaches this first wins, regardless of the lead. */
  maxPoints: number;
}

export const DEFAULT_RULES: ScoreRules = { pointsToWin: 21, winBy: 2, maxPoints: 30 };

export class ScoreManager {
  private readonly points: Record<Side, number> = { left: 0, right: 0 };

  constructor(readonly rules: ScoreRules = DEFAULT_RULES) {}

  get(side: Side): number {
    return this.points[side];
  }

  /** Adds a point unless the game is already decided. Returns the winner, if any. */
  addPoint(side: Side): Side | null {
    if (this.winner === null) this.points[side] += 1;
    return this.winner;
  }

  get winner(): Side | null {
    for (const side of ['left', 'right'] as const) {
      if (this.hasWon(side)) return side;
    }
    return null;
  }

  /** True when one more point would win the game for `side`. */
  isGamePoint(side: Side): boolean {
    if (this.winner !== null) return false;
    this.points[side] += 1;
    const wins = this.hasWon(side);
    this.points[side] -= 1;
    return wins;
  }

  reset(): void {
    this.points.left = 0;
    this.points.right = 0;
  }

  private hasWon(side: Side): boolean {
    const own = this.points[side];
    const other = this.points[side === 'left' ? 'right' : 'left'];
    const { pointsToWin, winBy, maxPoints } = this.rules;
    return own >= maxPoints || (own >= pointsToWin && own - other >= winBy);
  }
}
