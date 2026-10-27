import { directionOf, GROUND_Y, NET_TOP, NET_X } from '../entities/Court';
import type { ShotType, Side, Vec } from './types';

// Arcade shuttle physics: gravity, a capped fall speed and linear horizontal drag.
// Not a real aerodynamic model, just enough to give the steep shuttlecock-like descent.
export const SHUTTLE_GRAVITY = 300;
export const TERMINAL_FALL_SPEED = 115;
export const AIR_DRAG = 0.8;
export const FIXED_DT = 1 / 120;
const NET_BOUNCE_GAP = 2;
const NET_BOUNCE_DAMPING = 0.15;
const SMASH_DECAY_RATE = 6;
const MAX_SHOT_SPEED = 260;
/** Contact worse than this is not lifted over the net automatically. */
const MISHIT_QUALITY = 0.9;

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type StepResult = 'flying' | 'net' | 'ground';

/** Advance the shuttle by one step. Mutates `body`. */
export function stepShuttle(body: Body, dt: number, collideWithNet = true): StepResult {
  const prevX = body.x;
  const prevY = body.y;

  if (body.vy > TERMINAL_FALL_SPEED) {
    // Smashes start faster than terminal speed and slow down toward it.
    body.vy = Math.max(TERMINAL_FALL_SPEED, body.vy - (body.vy - TERMINAL_FALL_SPEED) * Math.min(1, SMASH_DECAY_RATE * dt));
  } else {
    body.vy = Math.min(TERMINAL_FALL_SPEED, body.vy + SHUTTLE_GRAVITY * dt);
  }
  // Linear in vx, so the landing distance scales exactly with launch vx (used by solveShotVelocity).
  body.vx /= 1 + AIR_DRAG * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;

  if (collideWithNet && crossesNet(prevX, body.x)) {
    const t = (NET_X - prevX) / (body.x - prevX);
    const yAtNet = prevY + (body.y - prevY) * t;
    if (yAtNet >= NET_TOP) {
      body.x = NET_X - Math.sign(body.vx) * NET_BOUNCE_GAP;
      body.y = yAtNet;
      body.vx = -body.vx * NET_BOUNCE_DAMPING;
      body.vy = Math.max(body.vy, 0) * NET_BOUNCE_DAMPING;
      return 'net';
    }
  }

  if (body.y >= GROUND_Y) {
    body.y = GROUND_Y;
    return 'ground';
  }
  return 'flying';
}

function crossesNet(fromX: number, toX: number): boolean {
  return (fromX < NET_X && toX >= NET_X) || (fromX > NET_X && toX <= NET_X);
}

export interface FlightPrediction {
  /** Where the shuttle touches the ground (or where it was after maxTime). */
  x: number;
  y: number;
  time: number;
  hitsNet: boolean;
  /** Positions at every step; only filled when `recordPath` is set. */
  path: Vec[];
}

export interface PredictOptions {
  ignoreNet?: boolean;
  recordPath?: boolean;
  maxTime?: number;
}

/** Simulate a flight with the same step function the game uses, so the prediction is exact. */
export function predictFlight(start: Body, options: PredictOptions = {}): FlightPrediction {
  const { ignoreNet = false, recordPath = false, maxTime = 6 } = options;
  const body = { ...start };
  const path: Vec[] = [];
  let hitsNet = false;
  let time = 0;
  while (time < maxTime) {
    const result = stepShuttle(body, FIXED_DT, !ignoreNet);
    time += FIXED_DT;
    if (recordPath) path.push({ x: body.x, y: body.y });
    if (result === 'net') hitsNet = true;
    if (result === 'ground') break;
  }
  return { x: body.x, y: body.y, time, hitsNet, path };
}

/** Horizontal velocity that lands the shuttle at `targetX` for a given vertical launch speed (net ignored). */
export function solveShotVelocity(from: Vec, targetX: number, vy: number): Vec {
  const unit = predictFlight({ x: from.x, y: from.y, vx: 1, vy }, { ignoreNet: true });
  const distancePerUnit = unit.x - from.x;
  const vx = distancePerUnit > 0 ? (targetX - from.x) / distancePerUnit : 0;
  return { x: Math.max(-MAX_SHOT_SPEED, Math.min(MAX_SHOT_SPEED, vx)), y: vy };
}

/** Whether the shot gets over the net and comes down on the far side. */
export function clearsNet(from: Vec, velocity: Vec): boolean {
  const flight = predictFlight({ x: from.x, y: from.y, vx: velocity.x, vy: velocity.y });
  return !flight.hitsNet && Math.sign(flight.x - NET_X) === Math.sign(velocity.x);
}

interface ShotSpec {
  /** Distance past the net the shot aims for. */
  depth: number;
  /** Initial vertical speed (negative = upward). */
  loft: number;
}

export const SHOT_SPECS: Record<Exclude<ShotType, 'smash'>, ShotSpec> = {
  drop: { depth: 26, loft: -115 },
  mid: { depth: 62, loft: -150 },
  clear: { depth: 92, loft: -185 },
};
export const SMASH_VELOCITY: Vec = { x: 215, y: 75 };
const MIN_SMASH_DOWN_SPEED = 15;

export interface ShotRequest {
  from: Vec;
  side: Side;
  shot: ShotType;
  /** 0 = sweet spot, 1 = edge of the racket. Worse contact means less control. */
  quality: number;
  /** Random value in [-1, 1] for placement error. */
  noise: number;
}

export interface Shot {
  velocity: Vec;
  shot: ShotType;
}

export function planShot({ from, side, shot, quality, noise }: ShotRequest): Shot {
  const dir = directionOf(side);

  if (shot === 'smash') {
    // Steepest downward angle that still gets over the net.
    const vx = dir * SMASH_VELOCITY.x * (1 - quality * 0.3);
    for (let vy = SMASH_VELOCITY.y; vy >= MIN_SMASH_DOWN_SPEED; vy -= 10) {
      const velocity = { x: vx, y: vy };
      if (clearsNet(from, velocity)) return { velocity, shot };
    }
    // Too low or too far from the net to smash: fall back to a normal shot.
    shot = 'mid';
  }

  const spec = SHOT_SPECS[shot];
  let targetX = NET_X + dir * (spec.depth + noise * (3 + quality * 26));
  let loft = spec.loft + quality * 30;
  let velocity = solveShotVelocity(from, targetX, loft);
  // A clean hit gets lifted over the net (and a little deeper, since the shuttle falls steeply);
  // a poor one may well end up in it.
  for (let attempt = 0; attempt < 6 && quality < MISHIT_QUALITY && !clearsNet(from, velocity); attempt++) {
    loft -= 12;
    targetX += dir * 8;
    velocity = solveShotVelocity(from, targetX, loft);
  }
  return { velocity, shot };
}
