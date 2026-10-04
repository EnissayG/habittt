import type { Species } from '../species';
import { buildBigLeafPlant, type BigLeafStyle } from './bigLeaf';

/** Striped leaves edged with a purple accent. */
const style: BigLeafStyle = {
  halfWidths: [1, 2, 3, 3, 3, 3, 2, 2, 1],
  reach: 2,
  step: 3,
  bladeTone(_leaf, row, dx) {
    const half = this.halfWidths[row] ?? 0;
    if (dx === 0) return 'leafDeep';
    if (Math.abs(dx) === half && row < 4) return 'leafAccent';
    return (row + Math.abs(dx)) % 2 ? 'leafLight' : 'leaf';
  },
};

export const calathea: Species = {
  id: 'calathea',
  hanging: false,
  build: (ctx) => buildBigLeafPlant(style, ctx),
};
