import { NET_TOP, WORLD_WIDTH } from '../entities/Court';
import { Player } from '../entities/Player';
import { SWING_ACTIVE_TIME } from '../entities/Racket';
import { Shuttlecock } from '../entities/Shuttlecock';
import { isOnSide, judgeLanding, racketContact } from './Collision';
import { FIXED_DT, planShot, stepShuttle } from './Physics';
import { ScoreManager } from './ScoreManager';
import { IDLE_INTENT, opposite, type Aim, type Intent, type ShotType, type Side } from './types';

export type Phase = 'serve' | 'rally' | 'point' | 'gameover';

export type GameEvent =
  | { type: 'hit'; side: Side; x: number; y: number; shot: ShotType }
  | { type: 'net'; x: number; y: number }
  | { type: 'land'; x: number; y: number; inBounds: boolean }
  | { type: 'point'; winner: Side }
  | { type: 'gameover'; winner: Side };

export type Intents = Record<Side, Intent>;

/** Pause after a point before the next serve. */
export const POINT_PAUSE = 1.1;
const MAX_FRAME_DT = 0.1;
const SERVE_QUALITY = 0.1;
const SERVE_HOLD_OFFSET = { x: 12, y: -10 };
/** The shuttle must be this far above the net for an airborne hit to become a smash. */
const SMASH_MIN_HEIGHT = 4;
/** Contact this good connects immediately. */
const SWEET_SPOT = 0.3;
/** Safety net for shuttles leaving the screen sideways. */
const OFFSCREEN_MARGIN = 40;
const SIDES: readonly Side[] = ['left', 'right'];

export class Game {
  readonly players: Record<Side, Player> = { left: new Player('left'), right: new Player('right') };
  readonly shuttle = new Shuttlecock();
  readonly score = new ScoreManager();
  phase: Phase = 'serve';
  server: Side = 'left';
  /** Hits in the current rally, including the serve. */
  hitCount = 0;
  bestRally = 0;
  paused = false;

  private phaseTimer = 0;
  private accumulator = 0;
  private stepIndex = 0;
  private readonly pendingSwing: Record<Side, boolean> = { left: false, right: false };
  /** Contact quality seen in the previous step while a swing waits for the closest approach. */
  private readonly contact: Record<Side, number | null> = { left: null, right: null };
  private events: GameEvent[] = [];

  constructor(private readonly rng: () => number = Math.random) {
    this.resetForServe();
  }

  get winner(): Side | null {
    return this.score.winner;
  }

  restart(): void {
    this.score.reset();
    this.server = 'left';
    this.bestRally = 0;
    this.paused = false;
    this.accumulator = 0;
    this.events = [];
    this.resetForServe();
  }

  /** Advances the game by a frame using fixed physics steps. */
  update(frameDt: number, intents: Intents): void {
    if (this.paused) return;
    // Swings are edge-triggered; keep them until a physics step actually consumes them.
    for (const side of SIDES) this.pendingSwing[side] ||= intents[side].swing;

    this.accumulator += Math.min(frameDt, MAX_FRAME_DT);
    while (this.accumulator >= FIXED_DT) {
      this.accumulator -= FIXED_DT;
      this.step(FIXED_DT, {
        left: { ...intents.left, swing: this.pendingSwing.left },
        right: { ...intents.right, swing: this.pendingSwing.right },
      });
      this.pendingSwing.left = false;
      this.pendingSwing.right = false;
    }
  }

  /** Returns and clears the events produced since the last call. */
  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  private step(dt: number, intents: Intents): void {
    const playing = this.phase === 'serve' || this.phase === 'rally';
    for (const side of SIDES) this.players[side].update(dt, playing ? intents[side] : IDLE_INTENT);

    switch (this.phase) {
      case 'serve':
        this.stepServe();
        break;
      case 'rally':
        this.stepRally(dt);
        break;
      case 'point':
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          const winner = this.score.winner;
          if (winner) {
            this.phase = 'gameover';
            this.events.push({ type: 'gameover', winner });
          } else {
            this.resetForServe();
          }
        }
        break;
      case 'gameover':
        break;
    }
  }

  private stepServe(): void {
    const server = this.players[this.server];
    this.holdShuttle(server);
    if (!server.swingStarted) return;

    const { velocity, shot } = planShot({
      from: { x: this.shuttle.x, y: this.shuttle.y },
      side: server.side,
      shot: aimToShot(server.swingAim),
      quality: SERVE_QUALITY,
      noise: this.noise(),
    });
    this.shuttle.launch(velocity, server.side);
    server.swingHit = true;
    this.phase = 'rally';
    this.registerHit(server.side, shot);
  }

  private stepRally(dt: number): void {
    const shuttle = this.shuttle;
    for (const side of SIDES) {
      const player = this.players[side];
      const previous = this.contact[side];
      this.contact[side] = null;
      if (!player.isSwingActive || player.swingHit) continue;
      if (shuttle.lastHitter === side || !isOnSide(side, shuttle.x)) continue;
      const quality = racketContact(player.racket, shuttle);
      if (quality === null) continue;
      // Connect at the closest approach rather than the first frame in reach.
      const closing = previous !== null && quality < previous;
      const lastChance = player.swingTime + dt > SWING_ACTIVE_TIME;
      if (quality > SWEET_SPOT && (previous === null || closing) && !lastChance) {
        this.contact[side] = quality;
        continue;
      }

      const smash = !player.grounded && shuttle.y < NET_TOP - SMASH_MIN_HEIGHT;
      const { velocity, shot } = planShot({
        from: { x: shuttle.x, y: shuttle.y },
        side,
        shot: smash ? 'smash' : aimToShot(player.swingAim),
        quality,
        noise: this.noise(),
      });
      shuttle.launch(velocity, side);
      player.swingHit = true;
      this.registerHit(side, shot);
      break;
    }

    const result = stepShuttle(shuttle, dt);
    if (this.stepIndex++ % 2 === 0) shuttle.recordTrail();
    if (result === 'net') this.events.push({ type: 'net', x: shuttle.x, y: shuttle.y });

    const offscreen = shuttle.x < -OFFSCREEN_MARGIN || shuttle.x > WORLD_WIDTH + OFFSCREEN_MARGIN;
    if (result === 'ground' || offscreen) {
      const landing = judgeLanding(shuttle.x, shuttle.lastHitter);
      shuttle.land();
      this.events.push({ type: 'land', x: shuttle.x, y: shuttle.y, inBounds: landing.inBounds });
      this.awardPoint(landing.winner);
    }
  }

  private registerHit(side: Side, shot: ShotType): void {
    this.hitCount += 1;
    this.bestRally = Math.max(this.bestRally, this.hitCount);
    this.events.push({ type: 'hit', side, x: this.shuttle.x, y: this.shuttle.y, shot });
  }

  private awardPoint(winner: Side): void {
    this.score.addPoint(winner);
    this.server = winner;
    this.players[winner].mood = 'win';
    this.players[opposite(winner)].mood = 'lose';
    this.phase = 'point';
    this.phaseTimer = POINT_PAUSE;
    this.events.push({ type: 'point', winner });
  }

  private resetForServe(): void {
    this.phase = 'serve';
    this.hitCount = 0;
    this.players.left.reset();
    this.players.right.reset();
    this.holdShuttle(this.players[this.server]);
  }

  /** The server holds the shuttle just in front of its paw. */
  private holdShuttle(server: Player): void {
    this.shuttle.hold(server.x + server.facing * SERVE_HOLD_OFFSET.x, server.y + SERVE_HOLD_OFFSET.y);
  }

  private noise(): number {
    return this.rng() * 2 - 1;
  }
}

export function aimToShot(aim: Aim): ShotType {
  if (aim === 1) return 'drop';
  if (aim === -1) return 'clear';
  return 'mid';
}
