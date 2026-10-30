/** Settings remembered between launches. Storage can be unavailable; callers fall back to their defaults. */
export function readSetting(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Not remembering the setting is fine.
  }
}
