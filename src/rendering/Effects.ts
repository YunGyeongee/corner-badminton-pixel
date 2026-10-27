import { GROUND_Y } from '../entities/Court';
import { HOME_X } from '../entities/Player';
import type { GameEvent } from '../game/Game';
import type { Vec } from '../game/types';
import { drawCenteredText, PALETTE } from './PixelAssets';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

const PARTICLE_GRAVITY = 160;
const POPUP_LIFE = 0.7;
const POPUP_RISE = 12;
const SMASH_SHAKE = 0.18;

/** Purely visual feedback (particles, popups, shake) driven by game events. */
export class Effects {
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private shakeTime = 0;

  constructor(private readonly rng: () => number = Math.random) {}

  handle(event: GameEvent): void {
    switch (event.type) {
      case 'hit':
        if (event.shot === 'smash') {
          this.burst(event.x, event.y, 12, 90, [PALETTE.yellow, PALETTE.orange, PALETTE.white]);
          this.popup('SMASH!', event.x, event.y - 10, PALETTE.yellow);
          this.shakeTime = SMASH_SHAKE;
        } else {
          this.burst(event.x, event.y, 6, 55, [PALETTE.white, PALETTE.lightGrey]);
        }
        break;
      case 'net':
        this.burst(event.x, event.y, 4, 30, [PALETTE.white]);
        this.popup('NET', event.x, event.y - 12, PALETTE.lightGrey);
        break;
      case 'land':
        this.burst(event.x, GROUND_Y, 5, 40, [PALETTE.lightGrey, PALETTE.peach], true);
        if (!event.inBounds) this.popup('OUT', event.x, GROUND_Y - 18, PALETTE.red);
        break;
      case 'point':
        this.burst(HOME_X[event.winner], 50, 14, 70, [PALETTE.yellow, PALETTE.pink, PALETTE.blue, PALETTE.lime]);
        break;
      case 'gameover':
        break;
    }
  }

  update(dt: number): void {
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += PARTICLE_GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < GROUND_Y + 2);
    for (const popup of this.popups) popup.life -= dt;
    this.popups = this.popups.filter((popup) => popup.life > 0);
  }

  get shakeOffset(): Vec {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    return { x: Math.round(this.rng() * 2 - 1), y: Math.round(this.rng() * 2 - 1) };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      // Particles blink out during the last third of their life.
      if (p.life < p.maxLife / 3 && Math.floor(p.life * 30) % 2 === 0) continue;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (const popup of this.popups) {
      const rise = (1 - popup.life / POPUP_LIFE) * POPUP_RISE;
      drawCenteredText(ctx, popup.text, popup.x, Math.round(popup.y - rise), popup.color);
    }
  }

  clear(): void {
    this.particles = [];
    this.popups = [];
    this.shakeTime = 0;
  }

  /** `upwardOnly` sprays particles in the upper half circle, e.g. dust from the floor. */
  private burst(x: number, y: number, count: number, speed: number, colors: readonly string[], upwardOnly = false): void {
    for (let i = 0; i < count; i++) {
      const angle = upwardOnly ? -Math.PI * this.rng() : this.rng() * Math.PI * 2;
      const velocity = speed * (0.4 + this.rng() * 0.6);
      const life = 0.3 + this.rng() * 0.35;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color: colors[Math.floor(this.rng() * colors.length)],
      });
    }
  }

  private popup(text: string, x: number, y: number, color: string): void {
    // Keep popups on screen near the walls.
    this.popups.push({ text, x: Math.max(14, Math.min(226, x)), y, life: POPUP_LIFE, color });
  }
}
