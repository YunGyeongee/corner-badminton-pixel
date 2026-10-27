import { isInBounds, NET_X, sideOf } from '../entities/Court';
import { RACKET_REACH } from '../entities/Racket';
import { opposite, type Side, type Vec } from './types';

/** A player may reach this far over the net before it counts as the other side. */
export const NET_REACH_TOLERANCE = 3;

/**
 * Returns the contact quality (0 = sweet spot .. 1 = edge) when the shuttle is within reach
 * of the racket, or null when it is out of reach.
 */
export function racketContact(racket: Vec, shuttle: Vec, reach = RACKET_REACH): number | null {
  const distance = Math.hypot(shuttle.x - racket.x, shuttle.y - racket.y);
  return distance <= reach ? distance / reach : null;
}

export function isOnSide(side: Side, x: number): boolean {
  return side === 'left' ? x <= NET_X + NET_REACH_TOLERANCE : x >= NET_X - NET_REACH_TOLERANCE;
}

export interface LandingResult {
  winner: Side;
  landedOn: Side;
  inBounds: boolean;
}

/**
 * Inside the court: the side it landed on loses the point.
 * Outside the court: whoever hit it last loses the point.
 */
export function judgeLanding(x: number, lastHitter: Side | null): LandingResult {
  const landedOn = sideOf(x);
  const inBounds = isInBounds(x);
  const loser = inBounds || lastHitter === null ? landedOn : lastHitter;
  return { winner: opposite(loser), landedOn, inBounds };
}
