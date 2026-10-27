import type { Vec } from '../game/types';

/** Sweet spot of the racket relative to the player's feet, for a player facing right. */
export const RACKET_OFFSET: Vec = { x: 13, y: -21 };
/** How far from the sweet spot the shuttle can still be hit. */
export const RACKET_REACH = 19;

export const SWING_DURATION = 0.28;
/** The swing can connect during the first part of the motion only. */
export const SWING_ACTIVE_TIME = 0.17;

/** The paw holding the racket, relative to the feet, facing right. The racket pivots here. */
export const HAND_OFFSET: Vec = { x: 9, y: -12 };
export const HANDLE_LENGTH = 6;
/** Distance from the paw to the center of the racket head. */
export const RACKET_LENGTH = 11;
/** Racket head semi-axes: along the handle and across it. */
export const RACKET_HEAD_LENGTH = 5;
export const RACKET_HEAD_WIDTH = 4.2;

const IDLE_ANGLE = -1.27;
const SWING_START_ANGLE = -2.7;
const SWING_END_ANGLE = 0.7;
const CHEER_ANGLE = -Math.PI / 2;
const SLUMP_ANGLE = 1.2;

export function racketPoint(x: number, y: number, facing: 1 | -1): Vec {
  return { x: x + facing * RACKET_OFFSET.x, y: y + RACKET_OFFSET.y };
}

/**
 * Racket angle in radians for a player facing right (0 = forward, -PI/2 = straight up).
 * `swingProgress` is 0..1 during a swing, null otherwise.
 */
export function racketAngle(swingProgress: number | null, mood: 'none' | 'win' | 'lose' = 'none'): number {
  if (swingProgress !== null) {
    const eased = 1 - (1 - swingProgress) ** 2;
    return SWING_START_ANGLE + (SWING_END_ANGLE - SWING_START_ANGLE) * eased;
  }
  if (mood === 'win') return CHEER_ANGLE;
  if (mood === 'lose') return SLUMP_ANGLE;
  return IDLE_ANGLE;
}
