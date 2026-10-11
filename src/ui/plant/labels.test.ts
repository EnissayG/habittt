import { renderPlant, SPECIES_IDS } from '../../domain';
import { plantName, SPECIES_ARTICLES } from './labels';

describe('plantName', () => {
  const grown = (species: string, seed: number) =>
    renderPlant({ species, seed, elapsedDays: 120, relapseDays: [] });

  it('gives every species an article', () => {
    for (const species of SPECIES_IDS) expect(['Un', 'Une']).toContain(SPECIES_ARTICLES[species]);
  });

  it('names a plant on one line: article, species and variety, then a full stop', () => {
    for (const species of SPECIES_IDS) {
      const name = plantName(grown(species, 3));
      expect(name).toMatch(/^Une? [a-zà-ÿ].*\.$/);
      expect(name).not.toContain('·');
    }
  });

  it('keeps the variety, in lower case after the article', () => {
    const fern = Array.from({ length: 40 }, (_, seed) => grown('fern', seed)).find(
      (image) => image.variety === 'boston-drooping',
    )!;
    expect(plantName(fern)).toBe('Une fougère de Boston (retombante).');
    expect(plantName(grown('cactus', 100))).toMatch(/^Un cactus/);
  });
});
