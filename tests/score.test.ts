import { describe, expect, it } from 'vitest';
import { ScoreManager } from '../src/game/ScoreManager';
import type { Side } from '../src/game/types';

function play(score: ScoreManager, left: number, right: number): void {
  // Alternate so neither side wins early by accident.
  const sequence: Side[] = [];
  for (let i = 0; i < Math.max(left, right); i++) {
    if (i < left) sequence.push('left');
    if (i < right) sequence.push('right');
  }
  for (const side of sequence) score.addPoint(side);
}

describe('ScoreManager', () => {
  it('starts at 0-0 with no winner', () => {
    const score = new ScoreManager();
    expect(score.get('left')).toBe(0);
    expect(score.get('right')).toBe(0);
    expect(score.winner).toBeNull();
  });

  it('wins at 21 with a 2 point lead', () => {
    const score = new ScoreManager();
    play(score, 20, 15);
    expect(score.winner).toBeNull();
    expect(score.addPoint('left')).toBe('left');
  });

  it('needs a 2 point lead from 20-20', () => {
    const score = new ScoreManager();
    play(score, 20, 20);
    expect(score.addPoint('left')).toBeNull();
    expect(score.addPoint('right')).toBeNull();
    expect(score.addPoint('right')).toBeNull();
    expect(score.addPoint('right')).toBe('right');
    expect(score.get('right')).toBe(23);
  });

  it('caps the game at 30 points', () => {
    const score = new ScoreManager();
    play(score, 29, 29);
    expect(score.winner).toBeNull();
    expect(score.addPoint('right')).toBe('right');
    expect(score.get('right')).toBe(30);
  });

  it('ignores points after the game is decided', () => {
    const score = new ScoreManager();
    play(score, 21, 0);
    score.addPoint('right');
    expect(score.get('right')).toBe(0);
  });

  it('detects game point', () => {
    const score = new ScoreManager();
    play(score, 20, 19);
    expect(score.isGamePoint('left')).toBe(true);
    expect(score.isGamePoint('right')).toBe(false);
    expect(score.get('left')).toBe(20);
  });

  it('resets', () => {
    const score = new ScoreManager();
    play(score, 21, 3);
    score.reset();
    expect(score.get('left')).toBe(0);
    expect(score.winner).toBeNull();
  });
});
