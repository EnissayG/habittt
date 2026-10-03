/**
 * Normalizes a user-entered habit name: trims the ends and collapses
 * internal whitespace runs into a single space.
 */
export function normalizeHabitName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
