import { readSetting, writeSetting } from './Settings';

/**
 * Ways to make the game less obvious on screen, remembered between launches:
 * see-through (the whole window fades) and a clear background (only the court and players are drawn).
 */
export const OPACITY_LEVELS = [1, 0.6, 0.3] as const;

const OPACITY_KEY = 'window-opacity';
const BACKGROUND_KEY = 'show-background';

/** The level after `current`, wrapping back to fully visible. */
export function nextOpacity(current: number): number {
  const index = OPACITY_LEVELS.findIndex((level) => level === current);
  return OPACITY_LEVELS[(index + 1) % OPACITY_LEVELS.length];
}

export function opacityLabel(opacity: number): string {
  return `${Math.round(opacity * 100)}%`;
}

export function loadOpacity(): number {
  const saved = Number(readSetting(OPACITY_KEY));
  return OPACITY_LEVELS.find((level) => level === saved) ?? 1;
}

export function saveOpacity(opacity: number): void {
  writeSetting(OPACITY_KEY, String(opacity));
}

/** Whether to draw the backdrop behind the court; on unless turned off before. */
export function loadShowBackground(): boolean {
  return readSetting(BACKGROUND_KEY) !== 'false';
}

export function saveShowBackground(show: boolean): void {
  writeSetting(BACKGROUND_KEY, String(show));
}
