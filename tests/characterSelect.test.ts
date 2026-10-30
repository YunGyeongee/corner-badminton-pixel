import { describe, expect, it } from 'vitest';
import { CHARACTER_IDS } from '../src/rendering/PixelAssets';
import { CharacterSelect } from '../src/ui/CharacterSelect';

describe('character select', () => {
  it('opens on the current character', () => {
    const select = new CharacterSelect();
    select.show('monkey');
    expect(select.open).toBe(true);
    expect(select.current).toBe('monkey');
  });

  it('wraps around when moving past either end or row', () => {
    const select = new CharacterSelect();
    select.show(CHARACTER_IDS[0]);
    select.move(-1);
    expect(select.current).toBe(CHARACTER_IDS.at(-1));
    select.show('rat');
    select.moveRow(1);
    expect(select.current).toBe('horse');
    select.moveRow(1);
    expect(select.current).toBe('rat');
  });

  it('finds the character under the mouse', () => {
    const select = new CharacterSelect();
    expect(select.hitTest({ x: 30, y: 40 })).toBe(0);
    expect(select.hitTest({ x: 210, y: 80 })).toBe(11);
    expect(select.hitTest({ x: 5, y: 40 })).toBe(-1);
    expect(select.hitTest({ x: 120, y: 120 })).toBe(-1);
  });
});
