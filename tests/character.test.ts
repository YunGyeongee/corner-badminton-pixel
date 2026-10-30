import { describe, expect, it } from 'vitest';
import { CHARACTER_IDS } from '../src/rendering/PixelAssets';
import { DEFAULT_CHARACTER, loadCharacter, stepCharacter } from '../src/ui/CharacterChoice';

describe('character choice', () => {
  it('starts as the rat when nothing is saved', () => {
    expect(loadCharacter()).toBe(DEFAULT_CHARACTER);
    expect(DEFAULT_CHARACTER).toBe('rat');
  });

  it('steps through every character both ways and wraps around', () => {
    let id = DEFAULT_CHARACTER;
    const seen = [];
    for (let i = 0; i < CHARACTER_IDS.length; i++) {
      id = stepCharacter(id, 1);
      seen.push(id);
    }
    expect(seen).toEqual([...CHARACTER_IDS.slice(1), CHARACTER_IDS[0]]);
    expect(stepCharacter(CHARACTER_IDS[0], -1)).toBe(CHARACTER_IDS.at(-1));
  });
});
