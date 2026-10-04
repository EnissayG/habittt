/**
 * Outcome of a business operation that can be refused by a rule.
 * Expected refusals are values, not exceptions: the compiler forces callers
 * to handle them. Exceptions are reserved for programming errors.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
