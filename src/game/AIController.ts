import { GROUND_Y, isInBounds, NET_X, sideOf } from '../entities/Court';
import { HOME_X, JUMP_SPEED, PLAYER_GRAVITY } from '../entities/Player';
import { RACKET_OFFSET, RACKET_REACH } from '../entities/Racket';
import { isOnSide, racketContact } from './Collision';
import type { Game } from './Game';
import { FIXED_DT, predictFlight } from './Physics';
import { IDLE_INTENT, opposite, type Aim, type Intent, type Side } from './types';

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard'];

export interface AIProfile {
  /** Fraction of full player speed. */
  speed: number;
  /** Seconds before reacting to the opponent's hit. */
  reaction: number;
  /** Chance of misreading where the shuttle will come down. */
  misjudgeChance: number;
  /** Maximum positioning error when misjudging, in pixels. */
  misjudgeError: number;
  /** Chance of letting a shuttle that is going out drop. */
  judgeOutChance: number;
  smashChance: number;
  /** Up to this many seconds of random early swing. */
  timingError: number;
  serveDelay: number;
}

export const AI_PROFILES: Record<Difficulty, AIProfile> = {
  easy: { speed: 0.7, reaction: 0.34, misjudgeChance: 0.3, misjudgeError: 24, judgeOutChance: 0.3, smashChance: 0, timingError: 0.22, serveDelay: 1.2 },
  normal: { speed: 0.85, reaction: 0.24, misjudgeChance: 0.24, misjudgeError: 22, judgeOutChance: 0.6, smashChance: 0.3, timingError: 0.16, serveDelay: 0.9 },
  hard: { speed: 1, reaction: 0.12, misjudgeChance: 0.08, misjudgeError: 16, judgeOutChance: 0.9, smashChance: 0.6, timingError: 0.1, serveDelay: 0.7 },
};

/** Height of the racket sweet spot when standing / at the top of a jump. */
const HIT_Y = GROUND_Y + RACKET_OFFSET.y;
const JUMP_HEIGHT = (JUMP_SPEED * JUMP_SPEED) / (2 * PLAYER_GRAVITY);
const JUMP_HIT_Y = HIT_Y - JUMP_HEIGHT + 4;
const JUMP_RISE_TIME = JUMP_SPEED / PLAYER_GRAVITY;
const ARRIVE_DISTANCE = 1.2;
const SWING_LOOKAHEAD = 0.05;

interface Plan {
  targetX: number;
  /** Let the shuttle drop instead of chasing it. */
  leave: boolean;
  smash: boolean;
  /** Seconds until the shuttle reaches the planned hitting height. */
  timeToIntercept: number;
  /** How far ahead the AI looks when deciding to swing; larger means swinging early. */
  swingLead: number;
}

export class AIController {
  private plan: Plan | null = null;
  private seenHitCount = -1;
  private reactTimer = 0;
  private serveTimer = 0;

  constructor(
    readonly side: Side,
    public difficulty: Difficulty = 'normal',
    private readonly rng: () => number = Math.random,
  ) {}

  private get profile(): AIProfile {
    return AI_PROFILES[this.difficulty];
  }

  reset(): void {
    this.plan = null;
    this.seenHitCount = -1;
    this.reactTimer = 0;
    this.serveTimer = 0;
  }

  getIntent(game: Game, dt: number): Intent {
    const me = game.players[this.side];
    const shuttle = game.shuttle;

    if (game.phase === 'serve') {
      this.plan = null;
      this.seenHitCount = -1;
      if (game.server !== this.side) return this.moveToward(game, HOME_X[this.side]);
      this.serveTimer += dt;
      if (this.serveTimer < this.profile.serveDelay) return IDLE_INTENT;
      this.serveTimer = 0;
      return { move: 0, jump: false, swing: true, aim: this.chooseAim(game) };
    }
    this.serveTimer = 0;
    if (game.phase !== 'rally') return IDLE_INTENT;

    const incoming = shuttle.state === 'flight' && shuttle.lastHitter !== this.side;
    if (!incoming) {
      this.plan = null;
      return this.moveToward(game, HOME_X[this.side], 0.6);
    }

    if (game.hitCount !== this.seenHitCount) {
      this.seenHitCount = game.hitCount;
      this.reactTimer = this.profile.reaction;
      this.plan = this.makePlan(game);
    }
    const plan = this.plan;
    if (plan) plan.timeToIntercept -= dt;
    if (this.reactTimer > 0) {
      this.reactTimer -= dt;
      return IDLE_INTENT;
    }
    if (!plan || plan.leave) return this.moveToward(game, HOME_X[this.side]);

    const intent = this.moveToward(game, plan.targetX);
    if (plan.smash && me.grounded && plan.timeToIntercept <= JUMP_RISE_TIME && Math.abs(me.x - plan.targetX) < 6) {
      intent.jump = true;
    }

    const ahead = { x: shuttle.x + shuttle.vx * plan.swingLead, y: shuttle.y + shuttle.vy * plan.swingLead };
    const inReach =
      racketContact(me.racket, shuttle, RACKET_REACH * 0.85) !== null ||
      racketContact(me.racket, ahead, RACKET_REACH * 0.7) !== null;
    if (me.swingTime < 0 && isOnSide(this.side, shuttle.x) && inReach) {
      intent.swing = true;
      intent.aim = this.chooseAim(game);
    }
    return intent;
  }

  private makePlan(game: Game): Plan {
    const { shuttle } = game;
    const me = game.players[this.side];
    const flight = predictFlight(shuttle, { recordPath: true });
    const leave: Plan = { targetX: HOME_X[this.side], leave: true, smash: false, timeToIntercept: 0, swingLead: 0 };

    if (sideOf(flight.x) !== this.side) return leave;
    if (!isInBounds(flight.x) && this.rng() < this.profile.judgeOutChance) return leave;

    let smash = this.rng() < this.profile.smashChance;
    let intercept = smash ? findDescentPoint(flight.path, JUMP_HIT_Y, this.side) : null;
    if (!intercept) {
      smash = false;
      intercept = findDescentPoint(flight.path, HIT_Y, this.side);
    }
    const point = intercept ?? { x: flight.x, index: flight.path.length - 1 };

    const misjudge = this.rng() < this.profile.misjudgeChance;
    const maxError = misjudge ? this.profile.misjudgeError : 2;
    const error = (this.rng() * 2 - 1) * maxError;
    return {
      targetX: point.x - me.facing * RACKET_OFFSET.x + error,
      leave: false,
      smash,
      timeToIntercept: (point.index + 1) * FIXED_DT,
      swingLead: SWING_LOOKAHEAD + this.rng() * this.profile.timingError,
    };
  }

  /** Places the shuttle away from where the opponent is standing. */
  private chooseAim(game: Game): Aim {
    const opponent = game.players[opposite(this.side)];
    const depth = Math.abs(opponent.x - NET_X);
    const roll = this.rng();
    if (depth < 45) return roll < 0.6 ? -1 : roll < 0.85 ? 0 : 1;
    if (depth > 80) return roll < 0.55 ? 1 : roll < 0.85 ? 0 : -1;
    return roll < 0.34 ? -1 : roll < 0.67 ? 0 : 1;
  }

  private moveToward(game: Game, x: number, speedScale = 1): Intent {
    const diff = x - game.players[this.side].x;
    if (Math.abs(diff) < ARRIVE_DISTANCE) return { ...IDLE_INTENT };
    const move = Math.max(-1, Math.min(1, diff / 4)) * this.profile.speed * speedScale;
    return { move, jump: false, swing: false };
  }
}

/** First point after the apex where the shuttle descends through height `y` on `side`. */
function findDescentPoint(path: readonly { x: number; y: number }[], y: number, side: Side): { x: number; index: number } | null {
  for (let i = 1; i < path.length; i++) {
    const descending = path[i].y > path[i - 1].y;
    if (descending && path[i].y >= y && isOnSide(side, path[i].x)) return { x: path[i].x, index: i };
  }
  return null;
}
