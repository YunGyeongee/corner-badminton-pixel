import { CHARACTER_IDS, type CharacterId } from '../rendering/PixelAssets';
import { readSetting, writeSetting } from './Settings';

const CHARACTER_KEY = 'character';
export const DEFAULT_CHARACTER: CharacterId = 'rat';

/** The character `delta` steps away from `current` in the menu order, wrapping around. */
export function stepCharacter(current: CharacterId, delta: number): CharacterId {
  const count = CHARACTER_IDS.length;
  return CHARACTER_IDS[(((CHARACTER_IDS.indexOf(current) + delta) % count) + count) % count];
}

export function loadCharacter(): CharacterId {
  const saved = readSetting(CHARACTER_KEY);
  return CHARACTER_IDS.find((id) => id === saved) ?? DEFAULT_CHARACTER;
}

export function saveCharacter(id: CharacterId): void {
  writeSetting(CHARACTER_KEY, id);
}
