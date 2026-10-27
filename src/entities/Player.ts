import type { Aim, Intent, Side, Vec } from '../game/types';
import { directionOf, GROUND_Y, NET_X, WORLD_WIDTH } from './Court';
import { racketPoint, SWING_ACTIVE_TIME, SWING_DURATION } from './Racket';

export const PLAYER_SPEED = 100;
export const JUMP_SPEED = 175;
export const PLAYER_GRAVITY = 560;
const CHEER_HOP_SPEED = 80;
/** Closest a player's center may get to the net or the screen edge. */
const NET_GAP = 10;
const EDGE_GAP = 9;

export const HOME_X: Record<Side, number> = { left: 52, right: 188 };

export type PlayerState = 'idle' | 'run' | 'jump' | 'swing' | 'win' | 'lose';
export type Mood = 'none' | 'win' | 'lose';

export class Player {
  readonly facing: 1 | -1;
  x = 0;
  y = GROUND_Y;
  vx = 0;
  vy = 0;
  /** Seconds since the swing started, or -1 when not swinging. */
  swingTime = -1;
  swingAim: Aim = 0;
  /** Whether the current swing already hit the shuttle. */
  swingHit = false;
  /** True for the single step in which a swing started. */
  swingStarted = false;
  mood: Mood = 'none';
  animTime = 0;

  constructor(readonly side: Side) {
    this.facing = directionOf(side);
    this.reset();
  }

  get minX(): number {
    return this.side === 'left' ? EDGE_GAP : NET_X + NET_GAP;
  }

  get maxX(): number {
    return this.side === 'left' ? NET_X - NET_GAP : WORLD_WIDTH - EDGE_GAP;
  }

  get grounded(): boolean {
    return this.y >= GROUND_Y;
  }

  get racket(): Vec {
    return racketPoint(this.x, this.y, this.facing);
  }

  get isSwingActive(): boolean {
    return this.swingTime >= 0 && this.swingTime <= SWING_ACTIVE_TIME;
  }

  get swingProgress(): number | null {
    return this.swingTime < 0 ? null : Math.min(1, this.swingTime / SWING_DURATION);
  }

  get state(): PlayerState {
    if (this.mood !== 'none') return this.mood;
    if (this.swingTime >= 0) return 'swing';
    if (!this.grounded) return 'jump';
    if (Math.abs(this.vx) > 1) return 'run';
    return 'idle';
  }

  reset(x = HOME_X[this.side]): void {
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.swingTime = -1;
    this.swingHit = false;
    this.swingStarted = false;
    this.mood = 'none';
  }

  update(dt: number, intent: Intent): void {
    this.animTime += dt;
    this.swingStarted = false;
    const locked = this.mood !== 'none';
    const move = locked ? 0 : Math.max(-1, Math.min(1, intent.move));

    this.vx = move * PLAYER_SPEED;
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x + this.vx * dt));

    if (this.grounded) {
      if (!locked && intent.jump) this.vy = -JUMP_SPEED;
      else if (this.mood === 'win') this.vy = -CHEER_HOP_SPEED;
    }
    this.vy += PLAYER_GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
    }

    if (this.swingTime >= 0) {
      this.swingTime += dt;
      if (this.swingTime >= SWING_DURATION) this.swingTime = -1;
    }
    if (!locked && intent.swing && this.swingTime < 0) {
      this.swingTime = 0;
      this.swingAim = intent.aim ?? aimFromMove(move, this.facing);
      this.swingHit = false;
      this.swingStarted = true;
    }
  }
}

/** Holding toward the net plays short, holding away plays long. */
export function aimFromMove(move: number, facing: 1 | -1): Aim {
  if (Math.abs(move) < 0.3) return 0;
  return Math.sign(move) === facing ? 1 : -1;
}
