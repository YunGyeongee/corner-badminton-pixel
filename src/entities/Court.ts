import type { Side } from '../game/types';

// Logical game resolution in pixels. Everything is rendered at this size and scaled up.
export const WORLD_WIDTH = 240;
export const WORLD_HEIGHT = 140;

/** y of the floor surface (y grows downward). */
export const GROUND_Y = 126;
export const NET_X = 120;
export const NET_TOP = 94;

/** Landing outside [COURT_LEFT, COURT_RIGHT] is out. */
export const COURT_LEFT = 14;
export const COURT_RIGHT = 226;

export function sideOf(x: number): Side {
  return x < NET_X ? 'left' : 'right';
}

export function isInBounds(x: number): boolean {
  return x >= COURT_LEFT && x <= COURT_RIGHT;
}

/** +1 if this side hits toward increasing x, -1 otherwise. */
export function directionOf(side: Side): 1 | -1 {
  return side === 'left' ? 1 : -1;
}
