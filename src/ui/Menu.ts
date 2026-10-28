import { WORLD_HEIGHT, WORLD_WIDTH } from '../entities/Court';
import type { Vec } from '../game/types';
import { drawCenteredText, drawText, PALETTE } from '../rendering/PixelAssets';

export type MenuAction = 'resume' | 'restart' | 'level' | 'background' | 'opacity' | 'pin' | 'quit';

export interface MenuItem {
  action: MenuAction;
  /** Labels can change (e.g. the current difficulty), so they are read on every draw. */
  label: () => string;
}

const PANEL_WIDTH = 110;
const PANEL_LEFT = (WORLD_WIDTH - PANEL_WIDTH) / 2;
// Leaves room above the control hints at y=106 for up to 8 items.
const PANEL_TOP = 8;
const ITEMS_TOP = PANEL_TOP + 16;
const ITEM_HEIGHT = 10;
const CENTER = WORLD_WIDTH / 2;

/** Pause menu, navigated with W/S + Space/Enter or the mouse. */
export class Menu {
  open = false;
  selected = 0;

  constructor(private readonly items: readonly MenuItem[]) {}

  get current(): MenuAction {
    return this.items[this.selected].action;
  }

  show(): void {
    this.open = true;
    this.selected = 0;
  }

  hide(): void {
    this.open = false;
  }

  move(delta: number): void {
    this.selected = (this.selected + delta + this.items.length) % this.items.length;
  }

  /** Index of the item under a point in game coordinates, or -1. */
  hitTest(point: Vec): number {
    if (point.x < PANEL_LEFT || point.x > PANEL_LEFT + PANEL_WIDTH) return -1;
    const index = Math.floor((point.y - ITEMS_TOP + 2) / ITEM_HEIGHT);
    return index >= 0 && index < this.items.length ? index : -1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const height = ITEMS_TOP - PANEL_TOP + this.items.length * ITEM_HEIGHT + 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = PALETTE.lavender;
    ctx.fillRect(PANEL_LEFT - 1, PANEL_TOP - 1, PANEL_WIDTH + 2, height + 2);
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(PANEL_LEFT, PANEL_TOP, PANEL_WIDTH, height);
    drawCenteredText(ctx, 'PAUSED', CENTER, PANEL_TOP + 5, PALETTE.yellow);

    this.items.forEach((item, index) => {
      const y = ITEMS_TOP + index * ITEM_HEIGHT;
      const active = index === this.selected;
      if (active) {
        ctx.fillStyle = PALETTE.plum;
        ctx.fillRect(PANEL_LEFT + 4, y - 2, PANEL_WIDTH - 8, ITEM_HEIGHT - 1);
        drawText(ctx, '>', PANEL_LEFT + 8, y, PALETTE.yellow);
      }
      drawText(ctx, item.label(), PANEL_LEFT + 16, y, active ? PALETTE.white : PALETTE.lightGrey);
    });

    drawCenteredText(ctx, 'A/D MOVE  W JUMP  SPACE HIT', CENTER, 106, PALETTE.lightGrey);
    drawCenteredText(ctx, 'HOLD TO NET: DROP  AWAY: CLEAR', CENTER, 114, PALETTE.lavender);
    drawCenteredText(ctx, 'JUMP + HIT HIGH: SMASH', CENTER, 122, PALETTE.lavender);
  }
}
