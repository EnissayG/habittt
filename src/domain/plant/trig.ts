// Deterministic sine and cosine.
//
// Math.sin and Math.cos are not required to return bit-identical results
// across JavaScript engines (V8 in Jest, Hermes on the phone). A one-ulp
// difference could flip a rounding and move a pixel, so a plant could differ
// between two synced devices. These versions use only +, -, * and /, which
// IEEE 754 defines exactly: every engine computes the same bits.
//
// sin(x):
// 1. Range reduction: r = x - k * 2π, with k = round(x / 2π), so r ∈ [-π, π].
// 2. Folding: sin(π - r) = sin(r), so r is brought into [-π/2, π/2].
// 3. Taylor series up to r^21, evaluated with Horner's scheme. On
//    [-π/2, π/2] the first omitted term is below 3e-16.
// cos(x) = sin(x + π/2).
// Measured gap with Math.sin over the plants' angles: below 1e-13.

const TWO_PI = 2 * Math.PI;
const HALF_PI = Math.PI / 2;

/** Taylor coefficients (-1)^n / (2n+1)!, n = 1..10, computed once. */
const COEFFICIENTS: readonly number[] = (() => {
  const result: number[] = [];
  let factorial = 1;
  for (let n = 1; n <= 10; n++) {
    factorial *= 2 * n * (2 * n + 1);
    result.push((n % 2 ? -1 : 1) / factorial);
  }
  return result;
})();

export function sin(x: number): number {
  if (!Number.isFinite(x)) return NaN;
  let r = x - Math.round(x / TWO_PI) * TWO_PI;
  if (r > HALF_PI) r = Math.PI - r;
  else if (r < -HALF_PI) r = -Math.PI - r;

  const r2 = r * r;
  let sum = 0;
  for (let i = COEFFICIENTS.length - 1; i >= 0; i--) sum = (sum + COEFFICIENTS[i]!) * r2;
  return r + r * sum;
}

export function cos(x: number): number {
  return sin(x + HALF_PI);
}
