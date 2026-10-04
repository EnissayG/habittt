import type { LocalDate } from './localDate';

/**
 * Source of time, injected so the domain stays pure and tests can freeze it.
 * Turning an instant into a local day depends on the device time zone, which
 * is why today() is provided by the implementation rather than computed here.
 */
export interface Clock {
  /** Current instant, ISO 8601 UTC (e.g. '2026-10-03T14:05:00.000Z'). */
  now(): string;
  /** Current calendar day in the user's time zone. */
  today(): LocalDate;
}

/** Returns a new random UUID. */
export type IdGenerator = () => string;

/** Returns a random unsigned 32-bit integer. */
export type SeedGenerator = () => number;
