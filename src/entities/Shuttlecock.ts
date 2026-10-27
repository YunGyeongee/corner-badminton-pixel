import type { Side, Vec } from '../game/types';

export type ShuttleState = 'held' | 'flight' | 'down';

const TRAIL_LENGTH = 7;

export class Shuttlecock {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  state: ShuttleState = 'held';
  lastHitter: Side | null = null;
  /** Recent positions, oldest first, for the motion trail. */
  readonly trail: Vec[] = [];

  hold(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = 'held';
    this.lastHitter = null;
    this.trail.length = 0;
  }

  launch(velocity: Vec, hitter: Side): void {
    this.vx = velocity.x;
    this.vy = velocity.y;
    this.state = 'flight';
    this.lastHitter = hitter;
  }

  land(): void {
    this.vx = 0;
    this.vy = 0;
    this.state = 'down';
  }

  recordTrail(): void {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
  }
}
