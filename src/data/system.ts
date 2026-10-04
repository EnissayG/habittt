import { getRandomValues, randomUUID } from 'expo-crypto';

import { parseLocalDate, type Clock, type LocalDate } from '../domain';

/** Calendar day of `instant` in the device's time zone. */
export function toLocalDate(instant: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return parseLocalDate(
    `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`,
  );
}

export const systemClock: Clock = {
  now: () => new Date().toISOString(),
  today: () => toLocalDate(new Date()),
};

export function generateId(): string {
  return randomUUID();
}

export function generateSeed(): number {
  return getRandomValues(new Uint32Array(1))[0] ?? 0;
}
