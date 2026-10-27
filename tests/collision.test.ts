import { describe, expect, it } from 'vitest';
import { COURT_LEFT, COURT_RIGHT, NET_X } from '../src/entities/Court';
import { RACKET_REACH } from '../src/entities/Racket';
import { isOnSide, judgeLanding, racketContact } from '../src/game/Collision';

describe('racketContact', () => {
  const racket = { x: 50, y: 100 };

  it('is perfect at the sweet spot', () => {
    expect(racketContact(racket, { x: 50, y: 100 })).toBe(0);
  });

  it('grows toward 1 at the edge of reach', () => {
    expect(racketContact(racket, { x: 50 + RACKET_REACH / 2, y: 100 })).toBeCloseTo(0.5);
    expect(racketContact(racket, { x: 50, y: 100 + RACKET_REACH })).toBeCloseTo(1);
  });

  it('misses beyond reach', () => {
    expect(racketContact(racket, { x: 50 + RACKET_REACH + 0.1, y: 100 })).toBeNull();
  });
});

describe('isOnSide', () => {
  it('allows a small reach over the net', () => {
    expect(isOnSide('left', NET_X - 10)).toBe(true);
    expect(isOnSide('left', NET_X + 2)).toBe(true);
    expect(isOnSide('left', NET_X + 10)).toBe(false);
    expect(isOnSide('right', NET_X + 10)).toBe(true);
    expect(isOnSide('right', NET_X - 10)).toBe(false);
  });
});

describe('judgeLanding', () => {
  it('gives the point to the other side when the shuttle lands in', () => {
    expect(judgeLanding(60, 'right')).toEqual({ winner: 'right', landedOn: 'left', inBounds: true });
    expect(judgeLanding(180, 'left')).toEqual({ winner: 'left', landedOn: 'right', inBounds: true });
  });

  it('penalizes the last hitter when the shuttle lands out', () => {
    expect(judgeLanding(COURT_RIGHT + 5, 'left')).toMatchObject({ winner: 'right', inBounds: false });
    expect(judgeLanding(COURT_LEFT - 5, 'right')).toMatchObject({ winner: 'left', inBounds: false });
  });

  it('loses the point when the shuttle drops back from the net onto your own side', () => {
    expect(judgeLanding(NET_X - 3, 'left').winner).toBe('right');
  });

  it('treats the lines as in', () => {
    expect(judgeLanding(COURT_LEFT, 'right').inBounds).toBe(true);
    expect(judgeLanding(COURT_RIGHT, 'left').inBounds).toBe(true);
  });
});
