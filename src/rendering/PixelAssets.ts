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

const OUTLINE = '#1a0d05';
const EYE = '#ffffff';

export const RACKET_COLORS = {
  face: '#d8e4ff',
  handle: '#a0602a',
} as const;

/** Headband and racket frame color per side; the HUD uses the same colors. */
export const TEAM_COLORS: Record<'left' | 'right', string> = {
  left: '#ff3838',
  right: '#38a0ff',
};

/** Colors behind a character's sprite codes; a character only lists the ones it uses. */
export interface CharacterColors {
  fur: string;
  belly?: string;
  accent?: string;
  nose?: string;
  detail?: string;
  shade?: string;
}

interface CharacterArt {
  colors: CharacterColors;
  idle: SpriteFrame;
  /** Rows replaced while jumping, given as { rowIndex: row }. By default the feet just lift a pixel. */
  tucked?: Record<number, string>;
  /** Pixels, as [col, row], where a little star twinkles now and then. */
  sparkles?: readonly SparklePoint[];
}

export type SparklePoint = readonly [col: number, row: number];

// Character sprites, 24x24, facing right; the renderer mirrors them for the right-hand player.
// Legend: k outline, w eye (the pixel right of an eye's lower half is its pupil), r headband (team color),
// o fur, c belly, t accent, n nose, p detail, h shade, . transparent.
// Every character has its paw around column 17-18, rows 12-14: the racket is drawn separately so it can
// swing around that paw (HAND_OFFSET in Racket.ts). The cheer and sad faces are made from the eyes.
const ART = {
  kangaroo: {
    colors: { fur: '#f08a24', belly: '#ffe2a8', accent: '#b85a10', nose: '#5a2410' },
    idle: [
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
    ],
    tucked: {
      21: 'kttkoooooooooook........',
      22: '.kkkkoooooooookk........',
      23: '.....kkkkkkkkk..........',
    },
  },
  rat: {
    colors: { fur: '#8f8fa3', belly: '#d9d9e6', accent: '#ffaacc', nose: '#ff77a8', detail: '#ffaacc' },
    idle: [
      '........................',
      '..kkk..kkk..............',
      '.kpppkkpppk.............',
      '.kpppkkpppk.............',
      '.kpppkkpppk.............',
      '..kkoooookkk............',
      '.krrrrrrrrrrk...........',
      '.koooooowwoook..........',
      '.koooooowkoooookk.......',
      '.kooooooooooooooonk.....',
      '..koooooooocccckkk......',
      '...kkooooccckkk.........',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      'tt.kooooocccck..........',
      't..koooooooook..........',
      't..kooookoooook.........',
      '.t.koook.kooook.........',
      '..kooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  ox: {
    colors: { fur: '#b8682a', belly: '#f2d3a0', accent: '#fff1e8', nose: '#5a2410', shade: '#3a1a08' },
    idle: [
      '........................',
      '.kk.......kk............',
      'ktk.......ktk...........',
      'ktkk.....kktk...........',
      '.kttkkkkkttk............',
      'kookooooooookok.........',
      '.krrrrrrrrrrk...........',
      '..koooooowwook..........',
      '..koooooowkocckk........',
      '..kooooooocccccck.......',
      '..koooooocccnccnk.......',
      '...kkooooccccckk........',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      'k.kooooocccck...........',
      'tkkoooooooook...........',
      'tk.kooookoooook.........',
      '...koook.kooook.........',
      '..khhhhk.khhhhhk........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  tiger: {
    colors: { fur: '#ffa300', belly: '#fff1e8', accent: '#1a0d05', nose: '#ff77a8', detail: '#e8283c', shade: '#9a1028' },
    idle: [
      '........................',
      '..kk.....kk.............',
      '.kcok...kock............',
      '.ktok...ktok............',
      '..kokkkkkok.............',
      '.kotototoook............',
      '.krrrrrrrrrrk...........',
      '.kttoooowwook...........',
      '.kootooowkoookk.........',
      '.kttooooooccccnk........',
      '..kotooocccccckk........',
      '..hpppppppppkk..........',
      '.hhkothpppphkkkkk.......',
      '.hkttoochpphcototok.....',
      '..kootocchhccktktkk.....',
      '..koooocccccck..........',
      '..kttoocccccck..........',
      '.t.kotocccccck..........',
      'to.koooocccck...........',
      'kt.kttoootook...........',
      '.kkkootokootook.........',
      '...koook.ktoook.........',
      '..kooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  rabbit: {
    colors: { fur: '#f4ece6', belly: '#ffffff', nose: '#ff77a8', detail: '#ffaacc' },
    idle: [
      '..kk..kk................',
      '.kpok.kpok..............',
      '.kpok.kpok..............',
      '.kpok.kpok..............',
      '.kpok.kpok..............',
      '..kookkookk.............',
      '.krrrrrrrrrrk...........',
      '.koooooowwook...........',
      '.koooooowkoookk.........',
      '.kpooooooooooonk........',
      '..kooooooocccckk........',
      '...kkooooccckk..........',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '.kkkooooocccck..........',
      'kcckoooooooook..........',
      'kcckooookoooook.........',
      '.kkkoook.kooook.........',
      '..kooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  dragon: {
    colors: { fur: '#3cb04a', belly: '#ffe27a', accent: '#ffd040', nose: '#1a5a20', detail: '#ff4060', shade: '#1f7a2e' },
    idle: [
      '.kk.....kk..............',
      '.ktk...ktk..............',
      '..ktk.ktk...............',
      '..kktkktkk..............',
      '.kkoooooookk............',
      'khkoooooooookk..........',
      '.krrrrrrrrrrkk..........',
      '.koooooowwooook.........',
      '.koooooowkoooookk.......',
      '.koooooooooooooonk......',
      '.kkkkooooocccckkk.......',
      'kcppkooooccckkk.........',
      'kpppkoooccccckkkkk......',
      'kpppkooccccccoooook.....',
      'kooooooccccccktktkk.....',
      '.kkkooocccccck..........',
      '.khoooocccccck..........',
      'kook.oooccccck..........',
      'koook.oocccck...........',
      '.kooookoooook...........',
      '..kkooookoooook.........',
      '...koook.kooook.........',
      '..kooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  snake: {
    colors: { fur: '#8fce3c', belly: '#f6e58d', accent: '#4f8a1e', detail: '#ff3838' },
    idle: [
      '........................',
      '........................',
      '........................',
      '...kkkkkkk..............',
      '..kooooooookk...........',
      '.koootoooooook..........',
      '.krrrrrrrrrrrk..........',
      '.koooooowwoooook........',
      '.koooooowkooooook.......',
      '..kooooooooooooook......',
      '...kkooocccckkkkkpp.....',
      '.....koocck.....p.......',
      '.....kooocck..kkkk......',
      '......kooocckkooook.....',
      '.......koooccckkkk......',
      '........kooocck.........',
      '........kooocck.........',
      '...kkkkkoooocck.........',
      '..kootoooooocck.........',
      '.kotoootooooook.........',
      '.kocccccccccook.........',
      'kotoootooootooook.......',
      'kooccccccccccccook......',
      '.kkkkkkkkkkkkkkkk.......',
    ],
  },
  horse: {
    colors: { fur: '#9a5a30', belly: '#e0b080', accent: '#3a2010', nose: '#3a2010', shade: '#3a2010' },
    idle: [
      '...kk.kk................',
      '..kok.kok...............',
      '..kokkkok...............',
      '.ktkoooookk.............',
      '.kttoooooook............',
      '.ktttooooooook..........',
      '.krrrrrrrrrrrk..........',
      'ktttooooowwoook.........',
      'ktttooooowkooookk.......',
      'kttkoooooooooooccck.....',
      'ktk.kooooooooocccnck....',
      'kk...kkoooockkkkkkk.....',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      'kk.kooooocccck..........',
      'ttkkoooooooook..........',
      'tt.kooookoooook.........',
      'kt.koook.kooook.........',
      '.k.khhhk.khhhhk.........',
      '...kkkkk.kkkkkk.........',
    ],
  },
  sheep: {
    colors: { fur: '#fff1e8', nose: '#ffaacc', shade: '#5f574f' },
    idle: [
      '........................',
      '...kk.kk.kk.............',
      '..koookoookk............',
      '.koooooooooook..........',
      'koooooooooooook.........',
      'kooooooookkkkk..........',
      '.krrrrrrrrrrrk..........',
      'kkoooookhwwhhk..........',
      'koooooookhwkhhhkk.......',
      'kooooooookhhhhhhhnk.....',
      '.kooooooookhhhhhkk......',
      '..kooooooookkkkk........',
      '..kooooooooookkkkk......',
      '.koooooooooookhhhhk.....',
      '.kooooooooooookkkkk.....',
      'koooooooooooook.........',
      'koooooooooooook.........',
      'koooooooooooook.........',
      '.koooooooooook..........',
      '..kkoooooooook..........',
      '...khhk.khhk............',
      '...khhk.khhk............',
      '..khhhk.khhhk...........',
      '..kkkkk.kkkkk...........',
    ],
  },
  monkey: {
    // A big pink bow sits on top of the head.
    colors: { fur: '#8a5a3a', belly: '#f0c8a0', accent: '#ff77a8', nose: '#5a2410', detail: '#f0c8a0', shade: '#b03060' },
    idle: [
      'kkkk.......kkkk.........',
      'ktttkkkkkkktttk.........',
      'kttttkhthkttttk.........',
      'kttttkhthkttttk.........',
      'ktttkkkkkkktttk.........',
      'kkkkoccooccokkk.........',
      '.krrrrrrrrrrrk..........',
      '.kooccccwwccok..........',
      '..koccccwkccckk.........',
      '..kocccccccccccnk.......',
      '..kooccccccccckk........',
      '...kkoocccckkk..........',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '.kkkooooocccck..........',
      'k..kooooooooook.........',
      'k..kooookoooook.........',
      'kk.koook.kooook.........',
      '.kkooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  rooster: {
    colors: { fur: '#fff1e8', accent: '#ffa300', detail: '#ff3838', shade: '#d8ccc0' },
    idle: [
      '.....k.k................',
      '....kpkpk...............',
      '...kpppppk..............',
      '...kkppppk..............',
      '..kooooooook............',
      '..koooooooook...........',
      '.krrrrrrrrrrk...........',
      '.koooooowwook...........',
      '.koooooowkoookkk........',
      '.kooooooooooktttk.......',
      '..koooooooooktkk........',
      '...kkooooooopk..........',
      '.k.koooooooopkkkk.......',
      'khkoooooooohhhhook......',
      'khhkooooohhhhkkkkk......',
      'khhkooooooohhk..........',
      '.khkoooooooook..........',
      '.khoooooooooook.........',
      '..kooooooooook..........',
      '...kkooooookk...........',
      '......kt.kt.............',
      '......kt.kt.............',
      '.....kttkttk............',
      '.....kkkkkkk............',
    ],
  },
  dog: {
    colors: { fur: '#e8b870', belly: '#fff1e8', accent: '#a06a30', nose: '#1a0d05' },
    idle: [
      '........................',
      '..kk....kk..............',
      '.ktok..ktok.............',
      '.ktok..ktok.............',
      '.kook..kook.............',
      '..kkoookkkk.............',
      '.krrrrrrrrrrk...........',
      '.koooooowwook...........',
      '.koooooowkoookk.........',
      '.kooooooocccccnk........',
      '..koooooocccccck........',
      '...kkooooccckkk.........',
      '...kooooccccckkkkk......',
      '..kooooccccccoooook.....',
      '..koooocccccckkkkkk.....',
      '..koooocccccck..........',
      '..koooocccccck..........',
      '..koooocccccck..........',
      'k..kooooocccck..........',
      'tk.koooooooook..........',
      'ktkkooookoooook.........',
      '.kkkoook.kooook.........',
      '..kooook.koooook........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
  pig: {
    sparkles: [[3, 11], [6, 13], [9, 13]],
    colors: { fur: '#ffaac0', belly: '#ffd0dc', accent: '#ff77a8', nose: '#b03060', detail: '#ffffff', shade: '#b03060' },
    idle: [
      '........................',
      '........................',
      '..kk....kk..............',
      '.ktk...ktk..............',
      '.kook.kook..............',
      '.kkoookookk.............',
      '.krrrrrrrrrrk...........',
      '.koooooowwook...........',
      '.koooooowkookkkk........',
      '.koooooooooktttk........',
      '.kooooooooooktntk.......',
      '..kppooocccktttk........',
      '..kpphppcccckkkkkk......',
      '.koooopphppcoooook......',
      '.koooocccpphkkkkkk......',
      '.koooocccccck...........',
      '.koooocccccck...........',
      '.koooocccccck...........',
      'kkoooocccccck...........',
      'tk.koooooooook..........',
      'kt.kooookoooook.........',
      '...koook.kooook.........',
      '..khhhhk.khhhhhk........',
      '..kkkkkk.kkkkkkk........',
    ],
  },
} satisfies Record<string, CharacterArt>;

export type CharacterId = keyof typeof ART;

/** The CPU always plays the kangaroo. */
export const CPU_CHARACTER: CharacterId = 'kangaroo';

/** Characters the player can choose: the twelve zodiac animals in order. */
export const CHARACTER_IDS: CharacterId[] = (Object.keys(ART) as CharacterId[]).filter((id) => id !== CPU_CHARACTER);

/** Copy of `frame` with some rows replaced, given as { rowIndex: row }. */
function withRows(frame: readonly string[], rows: Record<number, string>): string[] {
  return frame.map((row, index) => rows[index] ?? row);
}

/** The feet move up a row, as if the legs were pulled in. */
function liftFeet(frame: readonly string[]): Record<number, string> {
  return { [SPRITE_HEIGHT - 2]: frame[SPRITE_HEIGHT - 1], [SPRITE_HEIGHT - 1]: '.'.repeat(SPRITE_WIDTH) };
}

/** Eyes shut into a happy line: the upper half takes the color beside it, the lower half turns dark. */
function closeEyes(frame: readonly string[]): string[] {
  const top = frame.findIndex((row) => row.includes('w'));
  return withRows(frame, {
    [top]: frame[top].replace(/w+/g, (eye, at: number) => frame[top][at - 1].repeat(eye.length)),
    [top + 1]: frame[top + 1].replaceAll('w', 'k'),
  });
}

/** Heavy lids over the upper half of the eyes. */
function lowerEyes(frame: readonly string[]): string[] {
  const top = frame.findIndex((row) => row.includes('w'));
  return withRows(frame, { [top]: frame[top].replaceAll('w', 'k') });
}

export const SPRITE_WIDTH = 24;
export const SPRITE_HEIGHT = 24;
/** Sprite column drawn at the player's x position. */
export const SPRITE_ANCHOR_X = 9;

export type SpriteFrame = readonly string[];
export type Pose = 'idle' | 'jump' | 'cheer' | 'sad';

export interface Character {
  colors: CharacterColors;
  sprites: Record<Pose, SpriteFrame>;
  sparkles: readonly SparklePoint[];
}

function toCharacter(art: CharacterArt): Character {
  const jump = withRows(art.idle, art.tucked ?? liftFeet(art.idle));
  return {
    colors: art.colors,
    sprites: { idle: art.idle, jump, cheer: closeEyes(jump), sad: lowerEyes(art.idle) },
    sparkles: art.sparkles ?? [],
  };
}

export const CHARACTERS = {} as Record<CharacterId, Character>;
for (const id of Object.keys(ART) as CharacterId[]) CHARACTERS[id] = toCharacter(ART[id]);

/** Draws a sprite with its anchor column at `anchorX`; facing -1 mirrors it. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  anchorX: number,
  top: number,
  facing: 1 | -1,
  teamColor: string,
  colors: CharacterColors,
): void {
  for (let row = 0; row < SPRITE_HEIGHT; row++) {
    for (let col = 0; col < SPRITE_WIDTH; col++) {
      const color = spriteColor(frame[row][col], teamColor, colors);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(anchorX + facing * (col - SPRITE_ANCHOR_X), top + row, 1, 1);
    }
  }
}

const SPARKLE_PERIOD = 1.6;
/** Twinkles are spread over the period so they don't all flash at once. */
const SPARKLE_STAGGER = 0.37;

/**
 * A character's twinkles at `time` seconds: each one grows from a dot into a 4-point star and back,
 * then stays off for the rest of its cycle. Positions follow drawSprite.
 */
export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  sparkles: readonly SparklePoint[],
  anchorX: number,
  top: number,
  facing: 1 | -1,
  time: number,
): void {
  sparkles.forEach(([col, row], index) => {
    const phase = (time / SPARKLE_PERIOD + index * SPARKLE_STAGGER) % 1;
    const size = phase < 0.08 ? 1 : phase < 0.16 ? 2 : phase < 0.26 ? 3 : phase < 0.34 ? 2 : phase < 0.42 ? 1 : 0;
    if (size === 0) return;
    const x = anchorX + facing * (col - SPRITE_ANCHOR_X);
    const y = top + row;
    ctx.fillStyle = EYE;
    ctx.fillRect(x, y, 1, 1);
    for (let arm = 1; arm < size; arm++) {
      ctx.fillStyle = arm === 1 ? EYE : PALETTE.yellow;
      ctx.fillRect(x - arm, y, 1, 1);
      ctx.fillRect(x + arm, y, 1, 1);
      ctx.fillRect(x, y - arm, 1, 1);
      ctx.fillRect(x, y + arm, 1, 1);
    }
  });
}

export function spriteColor(code: string, teamColor: string, colors: CharacterColors): string | null {
  switch (code) {
    case 'k':
      return OUTLINE;
    case 'w':
      return EYE;
    case 'r':
      return teamColor;
    case 'o':
      return colors.fur;
    case 'c':
      return colors.belly ?? null;
    case 't':
      return colors.accent ?? null;
    case 'n':
      return colors.nose ?? null;
    case 'p':
      return colors.detail ?? null;
    case 'h':
      return colors.shade ?? null;
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
  ',': '... ... ... .#. #..', '+': '... .#. ### .#. ...', '%': '#.# ..# .#. #.. #.#', ' ': '... ... ... ... ...',
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
