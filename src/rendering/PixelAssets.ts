// All graphics are drawn in code from the tiny sprites and the 3x5 font below; no external assets.

/** PICO-8 style 16 color palette. */
export const PALETTE = {
  black: '#000000',
  navy: '#1d2b53',
  plum: '#7e2553',
  green: '#008751',
  brown: '#ab5236',
  darkGrey: '#5f574f',
  lightGrey: '#c2c3c7',
  white: '#fff1e8',
  red: '#ff004d',
  orange: '#ffa300',
  yellow: '#ffec27',
  lime: '#00e436',
  blue: '#29adff',
  lavender: '#83769c',
  pink: '#ff77a8',
  peach: '#ffccaa',
} as const;

/** Colors of the kangaroo character sprite. */
export const KANGAROO_COLORS = {
  outline: '#1a0d05',
  fur: '#f08a24',
  belly: '#ffe2a8',
  eye: '#ffffff',
  tailTip: '#b85a10',
  nose: '#5a2410',
  racketFace: '#d8e4ff',
  racketHandle: '#a0602a',
} as const;

/** Headband and racket frame color per side; the HUD uses the same colors. */
export const TEAM_COLORS: Record<'left' | 'right', string> = {
  left: '#ff3838',
  right: '#38a0ff',
};

// Kangaroo sprite, 24x24, facing right; the renderer mirrors it for the right-hand player.
// Legend: k outline, o fur, c belly, w eye, t tail tip, n nose, r headband (team color), . transparent.
// The racket is drawn separately so it can swing around the paw (HAND_OFFSET in Racket.ts).
const KANGAROO_IDLE = [
  '........................',
  '...kk...kk..............',
  '..kook.kook.............',
  '..kock.kock.............',
  '..kock.kock.............',
  '..kookkkookk............',
  '.krrrrrrrrrrk...........',
  '.koooooowwoook..........',
  '.koooooowkooookk........',
  '.koooooooooooooonk......',
  '..koooooooccccckk.......',
  '...kkooooccckkk.........',
  '...kooooccccckkkkk......',
  '..kooooccccccoooook.....',
  '..koooocccccckkkkkk.....',
  '..koooocccccck..........',
  '.kooooocccccck..........',
  '.kooooocccccck..........',
  '.koooooocccck...........',
  '.koooooooooook..........',
  'kkooooooooooook.........',
  'kttkooookoooook.........',
  '.kkkoookkooooookkk......',
  '....kook.koooooooook....',
];

/** Copy of `frame` with some rows replaced, given as { rowIndex: row }. */
function withRows(frame: readonly string[], rows: Record<number, string>): string[] {
  return frame.map((row, index) => rows[index] ?? row);
}

const LEGS_TUCKED = {
  21: 'kttkoooooooooook........',
  22: '.kkkkoooooooookk........',
  23: '.....kkkkkkkkk..........',
};
const EYES_CLOSED = { 7: '.koooooooooook..........', 8: '.kooooookkooookk........' };
const EYES_DOWNCAST = { 7: '.kooooookkoook..........' };

export const SPRITE_WIDTH = 24;
export const SPRITE_HEIGHT = 24;
/** Sprite column drawn at the player's x position. */
export const SPRITE_ANCHOR_X = 9;

export type SpriteFrame = readonly string[];

export const SPRITES = {
  idle: KANGAROO_IDLE,
  jump: withRows(KANGAROO_IDLE, LEGS_TUCKED),
  cheer: withRows(KANGAROO_IDLE, { ...EYES_CLOSED, ...LEGS_TUCKED }),
  sad: withRows(KANGAROO_IDLE, EYES_DOWNCAST),
} satisfies Record<string, SpriteFrame>;

export function spriteColor(code: string, teamColor: string): string | null {
  switch (code) {
    case 'k':
      return KANGAROO_COLORS.outline;
    case 'o':
      return KANGAROO_COLORS.fur;
    case 'c':
      return KANGAROO_COLORS.belly;
    case 'w':
      return KANGAROO_COLORS.eye;
    case 't':
      return KANGAROO_COLORS.tailTip;
    case 'n':
      return KANGAROO_COLORS.nose;
    case 'r':
      return teamColor;
    default:
      return null;
  }
}

// 3x5 bitmap font. Each glyph is 5 rows of 3 pixels.
const FONT_ROWS: Record<string, string> = {
  '0': '### #.# #.# #.# ###', '1': '.#. ##. .#. .#. ###', '2': '### ..# ### #.. ###', '3': '### ..# .## ..# ###',
  '4': '#.# #.# ### ..# ..#', '5': '### #.. ### ..# ###', '6': '### #.. ### #.# ###', '7': '### ..# ..# .#. .#.',
  '8': '### #.# ### #.# ###', '9': '### #.# ### ..# ###',
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
  ':': '... .#. ... .#. ...', '-': '... ... ### ... ...', '!': '.#. .#. .#. ... .#.', '.': '... ... ... ... .#.',
  '/': '..# ..# .#. #.. #..', '>': '#.. .#. ..# .#. #..', '<': '..# .#. #.. .#. ..#', '?': '##. ..# .#. ... .#.',
  ',': '... ... ... .#. #..', '+': '... .#. ### .#. ...', ' ': '... ... ... ... ...',
};

/** Glyph pixels as [x, y] pairs. */
export const FONT: Record<string, readonly [number, number][]> = Object.fromEntries(
  Object.entries(FONT_ROWS).map(([char, rows]) => [
    char,
    rows.split(' ').flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '#' ? [[x, y] as [number, number]] : []))),
  ]),
);

export const GLYPH_WIDTH = 3;
export const GLYPH_HEIGHT = 5;
const GLYPH_SPACING = 1;

export function textWidth(text: string, scale = 1): number {
  return text.length === 0 ? 0 : (text.length * (GLYPH_WIDTH + GLYPH_SPACING) - GLYPH_SPACING) * scale;
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1): void {
  ctx.fillStyle = color;
  let cursor = Math.round(x);
  const top = Math.round(y);
  for (const char of text.toUpperCase()) {
    for (const [gx, gy] of FONT[char] ?? FONT['?']) ctx.fillRect(cursor + gx * scale, top + gy * scale, scale, scale);
    cursor += (GLYPH_WIDTH + GLYPH_SPACING) * scale;
  }
}

/** Text with a 1px dark outline so it reads on any background. */
export function drawOutlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1): void {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(ctx, text, x + dx, y + dy, PALETTE.black, scale);
  drawText(ctx, text, x, y, color, scale);
}

export function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, color: string, scale = 1): void {
  drawOutlinedText(ctx, text, centerX - textWidth(text, scale) / 2, y, color, scale);
}

/** Pixel-exact line (Bresenham), so rotated shapes stay crisp. */
export function drawPixelLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  ctx.fillStyle = color;
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x, y, 1, 1);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
