import { describe, expect, it } from 'vitest';
import { FONT, GLYPH_HEIGHT, GLYPH_WIDTH, SPRITE_HEIGHT, SPRITE_WIDTH, SPRITES, textWidth } from '../src/rendering/PixelAssets';

describe('PixelAssets', () => {
  it('has rectangular sprites of the declared size', () => {
    for (const [name, frame] of Object.entries(SPRITES)) {
      expect(frame.length, name).toBe(SPRITE_HEIGHT);
      for (const row of frame) expect(row.length, `${name}: "${row}"`).toBe(SPRITE_WIDTH);
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
