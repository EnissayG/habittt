/** Number of angle steps in a full turn. Angles are integers in these units. */
export const STEPS_PER_TURN = 64;

/**
 * sin(2π·k/64), written out as decimal literals. Math.sin and Math.cos are
 * not required to return bit-identical results across JavaScript engines
 * (V8 in Jest, Hermes on the phone); a one-ulp difference could flip a
 * rounding and move a pixel. Literals are parsed identically everywhere.
 */
const SINE = [
  0, 0.098017, 0.19509, 0.290285, 0.382683, 0.471397, 0.55557, 0.634393, 0.707107, 0.77301, 0.83147,
  0.881921, 0.92388, 0.95694, 0.980785, 0.995185, 1, 0.995185, 0.980785, 0.95694, 0.92388, 0.881921,
  0.83147, 0.77301, 0.707107, 0.634393, 0.55557, 0.471397, 0.382683, 0.290285, 0.19509, 0.098017, 0,
  -0.098017, -0.19509, -0.290285, -0.382683, -0.471397, -0.55557, -0.634393, -0.707107, -0.77301,
  -0.83147, -0.881921, -0.92388, -0.95694, -0.980785, -0.995185, -1, -0.995185, -0.980785, -0.95694,
  -0.92388, -0.881921, -0.83147, -0.77301, -0.707107, -0.634393, -0.55557, -0.471397, -0.382683,
  -0.290285, -0.19509, -0.098017,
] as const;

const QUARTER_TURN = STEPS_PER_TURN / 4;

/** Sine of an angle expressed in steps of 1/64 turn. */
export function sinSteps(steps: number): number {
  const index = ((Math.round(steps) % STEPS_PER_TURN) + STEPS_PER_TURN) % STEPS_PER_TURN;
  return SINE[index] ?? 0;
}

/** Cosine of an angle expressed in steps of 1/64 turn. */
export function cosSteps(steps: number): number {
  return sinSteps(steps + QUARTER_TURN);
}

/** Converts radians to the nearest whole number of steps. */
export function radiansToSteps(radians: number): number {
  return Math.round((radians * STEPS_PER_TURN) / (2 * Math.PI));
}
