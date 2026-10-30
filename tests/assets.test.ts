import { describe, expect, it } from 'vitest';
import { HAND_OFFSET } from '../src/entities/Racket';
import {
  CHARACTER_IDS,
  CHARACTERS,
  CPU_CHARACTER,
  type CharacterId,
  FONT,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  SPRITE_ANCHOR_X,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  spriteColor,
  textWidth,
} from '../src/rendering/PixelAssets';

const ALL_CHARACTERS = Object.keys(CHARACTERS) as CharacterId[];

describe('PixelAssets', () => {
  it('offers the twelve zodiac animals in order', () => {
    expect(CHARACTER_IDS).toEqual([
      'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig',
    ]);
  });

  it('keeps the kangaroo for the CPU only', () => {
    expect(CPU_CHARACTER).toBe('kangaroo');
    expect(CHARACTER_IDS).not.toContain(CPU_CHARACTER);
  });

  it('has rectangular sprites of the declared size', () => {
    for (const id of ALL_CHARACTERS) {
      for (const [pose, frame] of Object.entries(CHARACTERS[id].sprites)) {
        const name = `${id} ${pose}`;
        expect(frame.length, name).toBe(SPRITE_HEIGHT);
        for (const row of frame) expect(row.length, `${name}: "${row}"`).toBe(SPRITE_WIDTH);
      }
    }
  });

  it('has a color for every pixel code a character uses', () => {
    for (const id of ALL_CHARACTERS) {
      const { colors, sprites } = CHARACTERS[id];
      for (const code of new Set(sprites.idle.join('').replaceAll('.', ''))) {
        expect(spriteColor(code, '#ff0000', colors), `${id} "${code}"`).not.toBeNull();
      }
    }
  });

  it('gives every character eyes that close when cheering', () => {
    for (const id of ALL_CHARACTERS) {
      const { idle, cheer, sad } = CHARACTERS[id].sprites;
      expect(idle.join(''), id).toContain('w');
      expect(cheer.join(''), id).not.toContain('w');
      expect(sad.join(''), id).not.toEqual(idle.join(''));
    }
  });

  it('gives every character a paw where the racket is held', () => {
    const col = SPRITE_ANCHOR_X + HAND_OFFSET.x;
    const row = SPRITE_HEIGHT + HAND_OFFSET.y;
    for (const id of ALL_CHARACTERS) {
      const idle = CHARACTERS[id].sprites.idle;
      const near = [-1, 0, 1].flatMap((dy) => [-1, 0].map((dx) => idle[row + dy][col + dx]));
      expect(near.some((cell) => cell !== '.'), id).toBe(true);
    }
  });

  it('puts sparkles on the character itself', () => {
    expect(CHARACTERS.pig.sparkles.length).toBeGreaterThan(0);
    for (const id of ALL_CHARACTERS) {
      for (const [col, row] of CHARACTERS[id].sparkles) {
        expect(CHARACTERS[id].sprites.idle[row]?.[col], `${id} ${col},${row}`).not.toMatch(/^\.?$/);
      }
    }
  });

  it('has glyphs for every letter and digit within the 3x5 grid', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+:-!./') {
      expect(FONT[char], char).toBeDefined();
      expect(FONT[char].length, char).toBeGreaterThan(0);
      for (const [x, y] of FONT[char]) {
        expect(x).toBeLessThan(GLYPH_WIDTH);
        expect(y).toBeLessThan(GLYPH_HEIGHT);
      }
    }
  });

  it('measures text', () => {
    expect(textWidth('')).toBe(0);
    expect(textWidth('A')).toBe(3);
    expect(textWidth('AB', 2)).toBe(14);
  });
});
