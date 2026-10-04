import type { Species } from '../species';
import { buildBigLeafPlant, type BigLeafStyle } from './bigLeaf';

/** Large leaves; holes (fenestrations) appear as the plant matures. */
const style: BigLeafStyle = {
  halfWidths: [1, 3, 4, 4, 4, 3, 2, 1],
  reach: 3,
  step: 4,
  bladeTone(leaf, row, dx, side) {
    const half = this.halfWidths[row] ?? 0;
    // From the 3rd leaf: inner holes. From the 5th: notches on the edge.
    if (leaf >= 2 && row >= 2 && row <= 5 && Math.abs(dx) === 2 && row % 2 === 0) return null;
    if (leaf >= 4 && Math.abs(dx) === half && row % 2 === 1 && row <= 5) return null;
    if (dx === 0) return 'leafDark';
    return dx * side > 0 ? 'leaf' : 'leafLight';
  },
};

export const monstera: Species = {
  id: 'monstera',
  hanging: false,
  build: (ctx) => buildBigLeafPlant(style, ctx),
};
