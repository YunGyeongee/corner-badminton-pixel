import { describe, expect, it } from 'vitest';
import { COURT_LEFT, COURT_RIGHT, GROUND_Y, isInBounds, NET_TOP, NET_X } from '../src/entities/Court';
import {
  AIR_DRAG,
  clearsNet,
  FIXED_DT,
  planShot,
  predictFlight,
  SHUTTLE_GRAVITY,
  solveShotVelocity,
  stepShuttle,
  TERMINAL_FALL_SPEED,
  type Body,
} from '../src/game/Physics';
import type { ShotType } from '../src/game/types';

describe('stepShuttle', () => {
  it('applies gravity and horizontal drag', () => {
    const body: Body = { x: 50, y: 50, vx: 100, vy: 0 };
    expect(stepShuttle(body, FIXED_DT)).toBe('flying');
    expect(body.vy).toBeCloseTo(SHUTTLE_GRAVITY * FIXED_DT);
    expect(body.vx).toBeCloseTo(100 / (1 + AIR_DRAG * FIXED_DT));
    expect(body.x).toBeGreaterThan(50);
    expect(body.y).toBeGreaterThan(50);
  });

  it('caps the fall speed', () => {
    const body: Body = { x: 50, y: 0, vx: 0, vy: 0 };
    for (let i = 0; i < 60; i++) stepShuttle(body, FIXED_DT);
    expect(body.vy).toBe(TERMINAL_FALL_SPEED);
  });

  it('slows a smash down toward terminal speed', () => {
    const body: Body = { x: 50, y: 0, vx: 0, vy: 300 };
    stepShuttle(body, FIXED_DT);
    expect(body.vy).toBeLessThan(300);
    expect(body.vy).toBeGreaterThan(TERMINAL_FALL_SPEED);
  });

  it('stops at the ground', () => {
    const body: Body = { x: 50, y: GROUND_Y - 0.1, vx: 0, vy: 50 };
    expect(stepShuttle(body, FIXED_DT)).toBe('ground');
    expect(body.y).toBe(GROUND_Y);
  });

  it('bounces back off the net when crossing below the tape', () => {
    const body: Body = { x: NET_X - 1, y: NET_TOP + 10, vx: 200, vy: 0 };
    expect(stepShuttle(body, FIXED_DT)).toBe('net');
    expect(body.x).toBeLessThan(NET_X);
    expect(body.vx).toBeLessThan(0);
  });

  it('passes over the net above the tape', () => {
    const body: Body = { x: NET_X - 1, y: NET_TOP - 10, vx: 200, vy: 0 };
    expect(stepShuttle(body, FIXED_DT)).toBe('flying');
    expect(body.x).toBeGreaterThan(NET_X);
  });

  it('can ignore the net for predictions', () => {
    const body: Body = { x: NET_X - 1, y: NET_TOP + 10, vx: 200, vy: 0 };
    expect(stepShuttle(body, FIXED_DT, false)).toBe('flying');
    expect(body.x).toBeGreaterThan(NET_X);
  });
});

describe('predictFlight', () => {
  it('matches stepping the shuttle manually', () => {
    const start: Body = { x: 40, y: 100, vx: 90, vy: -150 };
    const body = { ...start };
    while (stepShuttle(body, FIXED_DT) !== 'ground');
    const prediction = predictFlight(start);
    expect(prediction.x).toBeCloseTo(body.x);
    expect(prediction.y).toBe(GROUND_Y);
  });

  it('reports net hits', () => {
    expect(predictFlight({ x: 100, y: 110, vx: 150, vy: 0 }).hitsNet).toBe(true);
  });
});

describe('solveShotVelocity', () => {
  it('lands the shuttle on the target', () => {
    for (const target of [140, 180, 220]) {
      const velocity = solveShotVelocity({ x: 50, y: 110 }, target, -160);
      const flight = predictFlight({ x: 50, y: 110, vx: velocity.x, vy: velocity.y }, { ignoreNet: true });
      expect(flight.x).toBeCloseTo(target, 3);
    }
  });
});

describe('planShot', () => {
  const shots: Exclude<ShotType, 'smash'>[] = ['drop', 'mid', 'clear'];
  const positions = [
    { x: 20, y: 112 },
    { x: 60, y: 108 },
    { x: 105, y: 112 },
    { x: 80, y: 85 },
  ];

  it('sends clean hits over the net into the opponent court', () => {
    for (const shot of shots) {
      for (const from of positions) {
        const { velocity } = planShot({ from, side: 'left', shot, quality: 0, noise: 0 });
        const flight = predictFlight({ ...from, vx: velocity.x, vy: velocity.y });
        expect(flight.hitsNet, `${shot} from ${from.x},${from.y}`).toBe(false);
        expect(flight.x).toBeGreaterThan(NET_X);
        expect(isInBounds(flight.x)).toBe(true);
      }
    }
  });

  it('mirrors for the right side', () => {
    const from = { x: 200, y: 110 };
    const { velocity } = planShot({ from, side: 'right', shot: 'clear', quality: 0, noise: 0 });
    const flight = predictFlight({ ...from, vx: velocity.x, vy: velocity.y });
    expect(flight.x).toBeLessThan(NET_X);
    expect(flight.x).toBeGreaterThanOrEqual(COURT_LEFT);
  });

  it('orders shot depth drop < mid < clear', () => {
    const from = { x: 60, y: 110 };
    const depth = (shot: ShotType) => {
      const { velocity } = planShot({ from, side: 'left', shot, quality: 0, noise: 0 });
      return predictFlight({ ...from, vx: velocity.x, vy: velocity.y }).x;
    };
    expect(depth('drop')).toBeLessThan(depth('mid'));
    expect(depth('mid')).toBeLessThan(depth('clear'));
    expect(depth('clear')).toBeLessThanOrEqual(COURT_RIGHT);
  });

  it('smashes from high near the net', () => {
    const from = { x: 100, y: 78 };
    const result = planShot({ from, side: 'left', shot: 'smash', quality: 0, noise: 0 });
    expect(result.shot).toBe('smash');
    expect(result.velocity.y).toBeGreaterThan(0);
    expect(clearsNet(from, result.velocity)).toBe(true);
  });

  it('falls back to a normal shot when a smash would hit the net', () => {
    const result = planShot({ from: { x: 20, y: 105 }, side: 'left', shot: 'smash', quality: 0, noise: 0 });
    expect(result.shot).toBe('mid');
  });

  it('makes poor contact less accurate', () => {
    const from = { x: 60, y: 110 };
    const land = (quality: number) => {
      const { velocity } = planShot({ from, side: 'left', shot: 'mid', quality, noise: 1 });
      return predictFlight({ ...from, vx: velocity.x, vy: velocity.y }, { ignoreNet: true }).x;
    };
    const ideal = NET_X + 62;
    expect(Math.abs(land(1) - ideal)).toBeGreaterThan(Math.abs(land(0) - ideal));
  });
});
