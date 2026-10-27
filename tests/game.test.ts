import { describe, expect, it } from 'vitest';
import { GROUND_Y, NET_X } from '../src/entities/Court';
import { AIController, type Difficulty } from '../src/game/AIController';
import { Game, type GameEvent } from '../src/game/Game';
import { IDLE_INTENT, type Intent } from '../src/game/types';
import { seededRandom } from './random';

const FRAME = 1 / 60;
const swing: Intent = { ...IDLE_INTENT, swing: true };

function simulate(seed: number, difficulty: Difficulty, maxSeconds = 1200) {
  const rng = seededRandom(seed);
  const game = new Game(rng);
  const left = new AIController('left', difficulty, rng);
  const right = new AIController('right', difficulty, rng);
  const rallies: number[] = [];
  const events: GameEvent[] = [];
  for (let t = 0; t < maxSeconds && game.phase !== 'gameover'; t += FRAME) {
    const hits = game.hitCount;
    game.update(FRAME, { left: left.getIntent(game, FRAME), right: right.getIntent(game, FRAME) });
    for (const event of game.drainEvents()) {
      events.push(event);
      if (event.type === 'point') rallies.push(hits);
    }
  }
  return { game, rallies, events };
}

describe('Game', () => {
  it('starts with the left player holding the shuttle', () => {
    const game = new Game(seededRandom(1));
    expect(game.phase).toBe('serve');
    expect(game.shuttle.state).toBe('held');
  });

  it('serves when the server swings', () => {
    const game = new Game(seededRandom(1));
    game.update(FRAME, { left: swing, right: IDLE_INTENT });
    expect(game.phase).toBe('rally');
    expect(game.shuttle.state).toBe('flight');
    expect(game.shuttle.lastHitter).toBe('left');
    expect(game.hitCount).toBe(1);
    expect(game.drainEvents()).toContainEqual(expect.objectContaining({ type: 'hit', side: 'left' }));
  });

  it('keeps a swing pressed between physics steps', () => {
    const game = new Game(seededRandom(1));
    game.update(0.001, { left: swing, right: IDLE_INTENT });
    game.update(FRAME, { left: IDLE_INTENT, right: IDLE_INTENT });
    expect(game.phase).toBe('rally');
  });

  it('ignores the receiver swinging during the serve', () => {
    const game = new Game(seededRandom(1));
    game.update(FRAME, { left: IDLE_INTENT, right: swing });
    expect(game.phase).toBe('serve');
  });

  it('awards the point to the server when nobody returns the serve', () => {
    const game = new Game(seededRandom(1));
    game.update(FRAME, { left: swing, right: IDLE_INTENT });
    const events: GameEvent[] = [];
    for (let i = 0; i < 600 && game.phase === 'rally'; i++) {
      game.update(FRAME, { left: IDLE_INTENT, right: IDLE_INTENT });
      events.push(...game.drainEvents());
    }
    expect(game.phase).toBe('point');
    expect(game.score.get('left')).toBe(1);
    const land = events.find((e) => e.type === 'land');
    expect(land).toMatchObject({ inBounds: true });
    expect(game.shuttle.y).toBe(GROUND_Y);
    expect(game.shuttle.x).toBeGreaterThan(NET_X);
  });

  it('does nothing while paused', () => {
    const game = new Game(seededRandom(1));
    game.paused = true;
    game.update(FRAME, { left: swing, right: IDLE_INTENT });
    expect(game.phase).toBe('serve');
  });

  it('restarts from 0-0', () => {
    const { game } = simulate(3, 'normal');
    game.restart();
    expect(game.phase).toBe('serve');
    expect(game.score.get('left') + game.score.get('right')).toBe(0);
    expect(game.server).toBe('left');
  });
});

describe('AI vs AI', () => {
  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    it(`plays a full game with real rallies on ${difficulty}`, () => {
      const { game, rallies, events } = simulate(42, difficulty);
      expect(game.phase).toBe('gameover');
      expect(game.winner).not.toBeNull();
      const average = rallies.reduce((a, b) => a + b, 0) / rallies.length;
      expect(Math.max(...rallies)).toBeGreaterThanOrEqual(4);
      expect(average).toBeGreaterThan(2);
      expect(events.some((e) => e.type === 'gameover')).toBe(true);
    });
  }
});
