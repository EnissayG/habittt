import { clampGoal, MEDITATION_GOAL } from './meditationLog';
import { CAT_BREEDS, type CatBreed } from './scene/cat';

// The few choices the app keeps from one opening to the next (ADR 0022).
// Stored as text by key; read back with a default when absent or unreadable.

export const SETTING_KEYS = ['meditationGoal', 'meditationVibrate', 'lightsOff', 'cat'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export interface Settings {
  /** Days a week one aims to meditate (1 to 7). */
  meditationGoal: number;
  /** Vibrate with the breath during a session. */
  meditationVibrate: boolean;
  /** The lights of the room are off: every screen is dark (ADR 0021). */
  lightsOff: boolean;
  /** The cat of the room (ADR 0025), or none. */
  cat: CatBreed | 'none';
}

export const DEFAULT_SETTINGS: Settings = {
  meditationGoal: MEDITATION_GOAL.initial,
  meditationVibrate: true,
  lightsOff: false,
  cat: 'tabby',
};

const bool = (value: string | null, fallback: boolean) =>
  value === 'true' ? true : value === 'false' ? false : fallback;

/** Reads the stored text back into settings; anything unreadable keeps its default. */
export function readSettings(stored: Partial<Record<SettingKey, string | null>>): Settings {
  const goal = stored.meditationGoal == null ? NaN : Number(stored.meditationGoal);
  return {
    meditationGoal: Number.isFinite(goal) ? clampGoal(goal) : DEFAULT_SETTINGS.meditationGoal,
    meditationVibrate: bool(stored.meditationVibrate ?? null, DEFAULT_SETTINGS.meditationVibrate),
    lightsOff: bool(stored.lightsOff ?? null, DEFAULT_SETTINGS.lightsOff),
    cat:
      stored.cat === 'none' || (CAT_BREEDS as readonly string[]).includes(stored.cat ?? '')
        ? (stored.cat as CatBreed | 'none')
        : DEFAULT_SETTINGS.cat,
  };
}

/** The text stored for one setting. */
export function writeSetting<K extends SettingKey>(key: K, value: Settings[K]): string {
  return key === 'meditationGoal' ? String(clampGoal(value as number)) : String(value);
}
