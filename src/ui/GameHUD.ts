import { WORLD_WIDTH } from '../entities/Court';
import type { Game } from '../game/Game';
import { drawCenteredText, drawOutlinedText, PALETTE, TEAM_COLORS, textWidth } from '../rendering/PixelAssets';

const BLINK_RATE = 2.5;
const CENTER = WORLD_WIDTH / 2;

function blinkOn(time: number): boolean {
  return Math.floor(time * BLINK_RATE) % 2 === 0;
}

function pad(score: number): string {
  return score.toString().padStart(2, '0');
}

/** Score, rally counter and phase banners. `time` (seconds) drives blinking. */
export function drawHUD(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
  const left = pad(game.score.get('left'));
  const right = pad(game.score.get('right'));

  drawOutlinedText(ctx, 'YOU', 6, 5, TEAM_COLORS.left);
  drawOutlinedText(ctx, left, 20, 3, PALETTE.white, 2);
  drawOutlinedText(ctx, 'CPU', WORLD_WIDTH - 6 - textWidth('CPU'), 5, TEAM_COLORS.right);
  drawOutlinedText(ctx, right, WORLD_WIDTH - 20 - textWidth(right, 2), 3, PALETTE.white, 2);
  drawCenteredText(ctx, `RALLY ${game.hitCount}`, CENTER, 4, PALETTE.lightGrey);
  if (game.bestRally > 0) drawCenteredText(ctx, `BEST ${game.bestRally}`, CENTER, 11, PALETTE.lavender);

  const gamePoint = game.score.isGamePoint('left') || game.score.isGamePoint('right');
  if (gamePoint && blinkOn(time)) drawCenteredText(ctx, 'GAME POINT', CENTER, 18, PALETTE.yellow);

  switch (game.phase) {
    case 'serve':
      if (game.server === 'left') {
        const firstServe = game.score.get('left') + game.score.get('right') === 0;
        if (firstServe) drawCenteredText(ctx, 'A/D MOVE  W JUMP  SPACE HIT', CENTER, 32, PALETTE.white);
        if (blinkOn(time)) drawCenteredText(ctx, 'SPACE TO SERVE', CENTER, 42, PALETTE.yellow);
      }
      break;
    case 'point': {
      // The rally winner always serves next.
      const playerScored = game.server === 'left';
      drawCenteredText(ctx, playerScored ? 'NICE SHOT!' : 'CPU SCORES', CENTER, 36, TEAM_COLORS[playerScored ? 'left' : 'right'], 2);
      break;
    }
    case 'gameover':
      drawGameOver(ctx, game, time);
      break;
    case 'rally':
      break;
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
  const playerWon = game.winner === 'left';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(40, 26, WORLD_WIDTH - 80, 60);
  drawCenteredText(ctx, playerWon ? 'YOU WIN!' : 'CPU WINS', CENTER, 32, playerWon ? PALETTE.yellow : TEAM_COLORS.right, 2);
  drawCenteredText(ctx, `${game.score.get('left')} - ${game.score.get('right')}`, CENTER, 50, PALETTE.white);
  drawCenteredText(ctx, `BEST RALLY ${game.bestRally}`, CENTER, 60, PALETTE.lightGrey);
  if (blinkOn(time)) drawCenteredText(ctx, 'SPACE TO PLAY AGAIN', CENTER, 74, PALETTE.yellow);
}
