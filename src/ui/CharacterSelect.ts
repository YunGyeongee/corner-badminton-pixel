import { WORLD_HEIGHT, WORLD_WIDTH } from '../entities/Court';
import type { Vec } from '../game/types';
import {
  CHARACTER_IDS,
  CHARACTERS,
  drawCenteredText,
  drawSparkles,
  drawSprite,
  PALETTE,
  SPRITE_ANCHOR_X,
  SPRITE_WIDTH,
  TEAM_COLORS,
  type CharacterId,
} from '../rendering/PixelAssets';

const COLUMNS = 6;
const CELL_WIDTH = 34;
const CELL_HEIGHT = 40;
const GRID_LEFT = (WORLD_WIDTH - COLUMNS * CELL_WIDTH) / 2;
const GRID_TOP = 22;
const SPRITE_TOP = 3;
const NAME_TOP = 31;
const CENTER = WORLD_WIDTH / 2;
/** The select screen is still, so its sparkles are drawn as at this time: the first one at full size. */
const SPARKLE_SNAPSHOT_TIME = 0.3;

/** Character picker shown at launch and from the pause menu, navigated with W/A/S/D + Space/Enter or the mouse. */
export class CharacterSelect {
  open = false;
  selected = 0;

  get current(): CharacterId {
    return CHARACTER_IDS[this.selected];
  }

  show(current: CharacterId): void {
    this.open = true;
    this.selected = Math.max(0, CHARACTER_IDS.indexOf(current));
  }

  hide(): void {
    this.open = false;
  }

  /** Left/right step through every character in order; up/down jump a row. Both wrap around. */
  move(delta: number): void {
    const count = CHARACTER_IDS.length;
    this.selected = (((this.selected + delta) % count) + count) % count;
  }

  moveRow(delta: number): void {
    this.move(delta * COLUMNS);
  }

  /** Index of the character under a point in game coordinates, or -1. */
  hitTest(point: Vec): number {
    const col = Math.floor((point.x - GRID_LEFT) / CELL_WIDTH);
    const row = Math.floor((point.y - GRID_TOP) / CELL_HEIGHT);
    if (col < 0 || col >= COLUMNS || row < 0) return -1;
    const index = row * COLUMNS + col;
    return index < CHARACTER_IDS.length ? index : -1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    drawCenteredText(ctx, 'CHOOSE YOUR PLAYER', CENTER, 8, PALETTE.yellow);

    CHARACTER_IDS.forEach((id, index) => {
      const x = GRID_LEFT + (index % COLUMNS) * CELL_WIDTH;
      const y = GRID_TOP + Math.floor(index / COLUMNS) * CELL_HEIGHT;
      const active = index === this.selected;
      if (active) {
        ctx.fillStyle = PALETTE.yellow;
        ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        ctx.fillStyle = PALETTE.plum;
        ctx.fillRect(x + 1, y + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);
      }
      const { colors, sprites, sparkles } = CHARACTERS[id];
      const left = x + Math.floor((CELL_WIDTH - SPRITE_WIDTH) / 2);
      drawSprite(ctx, active ? sprites.cheer : sprites.idle, left + SPRITE_ANCHOR_X, y + SPRITE_TOP, 1, TEAM_COLORS.left, colors);
      drawSparkles(ctx, sparkles, left + SPRITE_ANCHOR_X, y + SPRITE_TOP, 1, SPARKLE_SNAPSHOT_TIME);
      drawCenteredText(ctx, id.toUpperCase(), x + CELL_WIDTH / 2, y + NAME_TOP, active ? PALETTE.white : PALETTE.lightGrey);
    });

    drawCenteredText(ctx, 'A/D W/S CHOOSE  SPACE PLAY', CENTER, 108, PALETTE.lightGrey);
    drawCenteredText(ctx, 'CPU PLAYS THE KANGAROO', CENTER, 118, PALETTE.lavender);
  }
}
