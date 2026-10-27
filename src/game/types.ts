export type Side = 'left' | 'right';

export interface Vec {
  x: number;
  y: number;
}

/** Shot direction relative to the hitter: 1 = toward the net (short), -1 = away from it (long). */
export type Aim = -1 | 0 | 1;

export type ShotType = 'drop' | 'mid' | 'clear' | 'smash';

/** What a controller (keyboard or AI) wants a player to do this frame. */
export interface Intent {
  /** Horizontal movement, -1 (left) .. 1 (right). */
  move: number;
  jump: boolean;
  /** Edge-triggered: true only on the frame the swing starts. */
  swing: boolean;
  /** Overrides the aim normally derived from `move` when swinging. */
  aim?: Aim;
}

export const IDLE_INTENT: Intent = { move: 0, jump: false, swing: false };

export function opposite(side: Side): Side {
  return side === 'left' ? 'right' : 'left';
}
