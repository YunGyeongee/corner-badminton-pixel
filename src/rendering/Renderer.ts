import { COURT_LEFT, COURT_RIGHT, GROUND_Y, NET_TOP, NET_X, WORLD_HEIGHT, WORLD_WIDTH } from '../entities/Court';
import type { Player } from '../entities/Player';
import {
  HAND_OFFSET,
  HANDLE_LENGTH,
  racketAngle,
  RACKET_HEAD_LENGTH,
  RACKET_HEAD_WIDTH,
  RACKET_LENGTH,
} from '../entities/Racket';
import type { Shuttlecock } from '../entities/Shuttlecock';
import type { Game, GameEvent } from '../game/Game';
import type { Vec } from '../game/types';
import { Effects } from './Effects';
import {
  drawPixelLine,
  KANGAROO_COLORS,
  PALETTE,
  SPRITE_ANCHOR_X,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  SPRITES,
  spriteColor,
  TEAM_COLORS,
  type SpriteFrame,
} from './PixelAssets';

/** Running is shown as a 1px hop at this interval. */
const RUN_BOB_TIME = 0.1;
const SERVICE_LINE_DISTANCE = 26;
const COURT_SURFACE_DEPTH = 5;
const WALL_BOARD_TOP = 106;
const MIN_WHOLE_SCALE_COVERAGE = 0.85;
/** Inner edge of the racket frame, as a fraction of the head size. */
const RACKET_FRAME_INNER = 0.62;

/**
 * Draws the game at its logical resolution into an offscreen buffer, then scales that buffer
 * up by an integer factor with smoothing off so pixels stay sharp on Retina displays.
 */
export class Renderer {
  readonly effects = new Effects();
  private readonly ctx: CanvasRenderingContext2D;
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferCtx: CanvasRenderingContext2D;
  private readonly background: HTMLCanvasElement;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private dpr = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = get2d(canvas);
    this.buffer = createCanvas(WORLD_WIDTH, WORLD_HEIGHT);
    this.bufferCtx = get2d(this.buffer);
    this.background = createCanvas(WORLD_WIDTH, WORLD_HEIGHT);
    drawBackground(get2d(this.background));
    this.resize();
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * this.dpr));
    const height = Math.max(1, Math.round(rect.height * this.dpr));
    this.canvas.width = width;
    this.canvas.height = height;
    const fit = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    // Whole-number scaling keeps every pixel the same size. At display scales like 125% that
    // would leave wide empty borders, so fall back to filling the window instead.
    const whole = Math.floor(fit);
    this.scale = whole >= 1 && whole / fit >= MIN_WHOLE_SCALE_COVERAGE ? whole : fit;
    this.offsetX = Math.floor((width - WORLD_WIDTH * this.scale) / 2);
    this.offsetY = Math.floor((height - WORLD_HEIGHT * this.scale) / 2);
  }

  /** Converts a mouse position to game coordinates. */
  toWorld(clientX: number, clientY: number): Vec {
    const rect = this.canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (this.canvas.width / rect.width);
    const py = (clientY - rect.top) * (this.canvas.height / rect.height);
    return { x: (px - this.offsetX) / this.scale, y: (py - this.offsetY) / this.scale };
  }

  addEvents(events: readonly GameEvent[]): void {
    for (const event of events) this.effects.handle(event);
  }

  render(game: Game, dt: number, drawOverlay: (ctx: CanvasRenderingContext2D) => void): void {
    // Moving the window to a display with a different pixel ratio needs a new backing size.
    if ((window.devicePixelRatio || 1) !== this.dpr) this.resize();
    this.effects.update(dt);

    const ctx = this.bufferCtx;
    const shake = this.effects.shakeOffset;
    ctx.save();
    ctx.translate(shake.x, shake.y);
    ctx.drawImage(this.background, 0, 0);
    drawShadows(ctx, game);
    drawPlayer(ctx, game.players.left);
    drawPlayer(ctx, game.players.right);
    drawShuttle(ctx, game.shuttle);
    this.effects.draw(ctx);
    ctx.restore();
    drawOverlay(ctx);

    const out = this.ctx;
    out.imageSmoothingEnabled = false;
    out.fillStyle = PALETTE.navy;
    out.fillRect(0, 0, this.canvas.width, this.canvas.height);
    out.drawImage(this.buffer, this.offsetX, this.offsetY, WORLD_WIDTH * this.scale, WORLD_HEIGHT * this.scale);
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Static scenery, drawn once into its own canvas. */
function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Gym wall with ceiling lights.
  ctx.fillStyle = PALETTE.navy;
  ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
  for (const x of [30, 90, 150, 210]) {
    ctx.fillStyle = PALETTE.lavender;
    ctx.fillRect(x - 7, 0, 14, 2);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(x - 5, 0, 10, 1);
  }
  // Board along the bottom of the wall.
  ctx.fillStyle = PALETTE.plum;
  ctx.fillRect(0, WALL_BOARD_TOP, WORLD_WIDTH, GROUND_Y - WALL_BOARD_TOP);
  ctx.fillStyle = PALETTE.lavender;
  ctx.fillRect(0, WALL_BOARD_TOP, WORLD_WIDTH, 1);
  ctx.fillStyle = PALETTE.navy;
  for (let x = 12; x < WORLD_WIDTH; x += 24) ctx.fillRect(x, WALL_BOARD_TOP + 1, 1, GROUND_Y - WALL_BOARD_TOP - 1);

  // Floor: court surface with lines, then the wooden edge below it.
  ctx.fillStyle = PALETTE.brown;
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
  ctx.fillStyle = PALETTE.green;
  ctx.fillRect(COURT_LEFT, GROUND_Y, COURT_RIGHT - COURT_LEFT + 1, COURT_SURFACE_DEPTH);
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(COURT_LEFT, GROUND_Y, 1, COURT_SURFACE_DEPTH);
  ctx.fillRect(COURT_RIGHT, GROUND_Y, 1, COURT_SURFACE_DEPTH);
  ctx.fillStyle = PALETTE.lightGrey;
  ctx.fillRect(NET_X - SERVICE_LINE_DISTANCE, GROUND_Y, 1, COURT_SURFACE_DEPTH);
  ctx.fillRect(NET_X + SERVICE_LINE_DISTANCE, GROUND_Y, 1, COURT_SURFACE_DEPTH);
  ctx.fillStyle = PALETTE.plum;
  ctx.fillRect(0, GROUND_Y + COURT_SURFACE_DEPTH, WORLD_WIDTH, 1);
  for (let x = 8; x < WORLD_WIDTH; x += 20) ctx.fillRect(x, GROUND_Y + COURT_SURFACE_DEPTH + 1, 1, WORLD_HEIGHT);

  // Net: post, mesh and tape.
  ctx.fillStyle = PALETTE.lightGrey;
  ctx.fillRect(NET_X - 1, NET_TOP, 2, GROUND_Y - NET_TOP);
  for (let y = NET_TOP + 1; y < NET_TOP + 20; y++) {
    for (let x = NET_X - 2; x <= NET_X + 1; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(NET_X - 2, NET_TOP - 1, 4, 2);
}

function drawShadows(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (const player of [game.players.left, game.players.right]) {
    const width = GROUND_Y - player.y > 10 ? 10 : 16;
    ctx.fillRect(Math.round(player.x - width / 2), GROUND_Y, width, 1);
  }
  // The shuttle's shadow helps judge where it will come down.
  const shuttle = game.shuttle;
  if (shuttle.state === 'flight') ctx.fillRect(Math.round(shuttle.x) - 1, GROUND_Y, 3, 1);
}

function playerFrame(player: Player): SpriteFrame {
  switch (player.state) {
    case 'win':
      return SPRITES.cheer;
    case 'lose':
      return SPRITES.sad;
    case 'jump':
      return SPRITES.jump;
    case 'swing':
      return player.grounded ? SPRITES.idle : SPRITES.jump;
    case 'run':
    case 'idle':
      return SPRITES.idle;
  }
}

/** Vertical offset for the running hop. */
function playerBob(player: Player): number {
  return player.state === 'run' && Math.floor(player.animTime / RUN_BOB_TIME) % 2 === 1 ? -1 : 0;
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  const teamColor = TEAM_COLORS[player.side];
  const frame = playerFrame(player);
  const x = Math.round(player.x);
  const top = Math.round(player.y) - SPRITE_HEIGHT + playerBob(player);
  for (let row = 0; row < SPRITE_HEIGHT; row++) {
    for (let col = 0; col < SPRITE_WIDTH; col++) {
      const color = spriteColor(frame[row][col], teamColor);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + player.facing * (col - SPRITE_ANCHOR_X), top + row, 1, 1);
    }
  }
  drawRacket(ctx, player, teamColor);
}

function drawRacket(ctx: CanvasRenderingContext2D, player: Player, frameColor: string): void {
  const progress = player.swingProgress;
  // Work with pixel centers so the rotated racket stays symmetric.
  const hand = {
    x: Math.round(player.x) + player.facing * HAND_OFFSET.x + 0.5,
    y: Math.round(player.y) + HAND_OFFSET.y + playerBob(player) + 0.5,
  };
  const direction = (angle: number): Vec => ({ x: Math.cos(angle) * player.facing, y: Math.sin(angle) });

  // A short swoosh behind the racket head while swinging.
  if (progress !== null && progress < 0.75) {
    ctx.fillStyle = PALETTE.lavender;
    for (const lag of [0.12, 0.22, 0.32]) {
      const d = direction(racketAngle(Math.max(0, progress - lag)));
      const tip = RACKET_LENGTH + RACKET_HEAD_LENGTH;
      ctx.fillRect(Math.floor(hand.x + d.x * tip), Math.floor(hand.y + d.y * tip), 1, 1);
    }
  }

  const d = direction(racketAngle(progress, player.mood));
  drawPixelLine(
    ctx,
    Math.floor(hand.x),
    Math.floor(hand.y),
    Math.floor(hand.x + d.x * HANDLE_LENGTH),
    Math.floor(hand.y + d.y * HANDLE_LENGTH),
    KANGAROO_COLORS.racketHandle,
  );

  // Racket head: an ellipse along the handle, team-colored frame around a pale string bed.
  const cx = hand.x + d.x * RACKET_LENGTH;
  const cy = hand.y + d.y * RACKET_LENGTH;
  const extent = Math.ceil(RACKET_HEAD_LENGTH) + 1;
  for (let py = Math.floor(cy) - extent; py <= Math.floor(cy) + extent; py++) {
    for (let px = Math.floor(cx) - extent; px <= Math.floor(cx) + extent; px++) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const along = (dx * d.x + dy * d.y) / RACKET_HEAD_LENGTH;
      const across = (dx * -d.y + dy * d.x) / RACKET_HEAD_WIDTH;
      const distance = along * along + across * across;
      if (distance > 1) continue;
      ctx.fillStyle = distance > RACKET_FRAME_INNER ? frameColor : KANGAROO_COLORS.racketFace;
      ctx.fillRect(px, py, 1, 1);
    }
  }
}

function drawShuttle(ctx: CanvasRenderingContext2D, shuttle: Shuttlecock): void {
  if (shuttle.state === 'flight') {
    ctx.fillStyle = PALETTE.lavender;
    for (const point of shuttle.trail.slice(0, -1)) ctx.fillRect(Math.round(point.x), Math.round(point.y), 1, 1);
  }

  // Cork leads in the direction of travel, feathers fan out behind it.
  const speed = Math.hypot(shuttle.vx, shuttle.vy);
  let dir: Vec = speed > 1 ? { x: shuttle.vx / speed, y: shuttle.vy / speed } : { x: 0, y: 1 };
  if (shuttle.state === 'down') dir = { x: Math.sign(shuttle.x - NET_X) || 1, y: 0 };
  const x = Math.round(shuttle.x);
  const y = Math.round(shuttle.y) - (shuttle.state === 'down' ? 1 : 0);
  const behind = (distance: number, spread = 0): [number, number] => [
    Math.round(x - dir.x * distance - dir.y * spread),
    Math.round(y - dir.y * distance + dir.x * spread),
  ];
  ctx.fillStyle = PALETTE.lightGrey;
  for (const [px, py] of [behind(2, -1), behind(2, 1), behind(2)]) ctx.fillRect(px, py, 1, 1);
  ctx.fillStyle = PALETTE.red;
  const [bx, by] = behind(1);
  ctx.fillRect(bx, by, 1, 1);
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(x, y, 1, 1);
}
