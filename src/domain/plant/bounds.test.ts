import { dayAt, usedRows } from './bounds';
import { MAX_GROWTH_DAYS } from './grid';
import { renderPlant } from './renderPlant';

describe('usedRows', () => {
  it('spans from the plant top to the shelf for a standing plant', () => {
    const image = renderPlant({
      species: 'monstera',
      seed: 42,
      elapsedDays: MAX_GROWTH_DAYS,
      relapseDays: [],
    });
    const rows = usedRows(image);
    expect(rows.bottom).toBe(image.height - 1); // the shelf is the last row
    const firstFilled = image.pixels.findIndex((pixel) => pixel !== null);
    expect(rows.top).toBe(Math.floor(firstFilled / image.width));
  });

  it('grows upwards with age', () => {
    const young = usedRows(
      renderPlant({ species: 'monstera', seed: 42, elapsedDays: 5, relapseDays: [] }),
    );
    const old = usedRows(
      renderPlant({ species: 'monstera', seed: 42, elapsedDays: 120, relapseDays: [] }),
    );
    expect(old.top).toBeLessThan(young.top);
  });

  it('starts near the top for a hanging plant', () => {
    const rows = usedRows(
      renderPlant({ species: 'pothos', seed: 42, elapsedDays: 120, relapseDays: [] }),
    );
    expect(rows.top).toBeLessThan(10);
  });

  it('is empty (top > bottom) for an image without pixels', () => {
    const image = renderPlant({ species: 'monstera', seed: 1, elapsedDays: 0, relapseDays: [] });
    const empty = { ...image, pixels: image.pixels.map(() => null) };
    const rows = usedRows(empty);
    expect(rows.top).toBeGreaterThan(rows.bottom);
  });
});

describe('dayAt', () => {
  const image = renderPlant({ species: 'monstera', seed: 42, elapsedDays: 60, relapseDays: [] });
  const indexOfDay = (day: number) => image.pixels.findIndex((pixel) => pixel?.day === day);

  it('gives the day of the pixel under the finger', () => {
    const i = indexOfDay(30);
    expect(dayAt(image, i % image.width, Math.floor(i / image.width))).toBe(image.pixels[i]!.day);
  });

  it('takes the nearest grown pixel when the finger is a little beside the plant', () => {
    const i = indexOfDay(60);
    const x = i % image.width;
    const y = Math.floor(i / image.width);
    const found = dayAt(image, x, y - 2);
    expect(found).not.toBeNull();
    expect(found).toBeGreaterThan(0);
  });

  it('gives nothing on the pot, the shelf or far from the plant', () => {
    expect(dayAt(image, image.width / 2, image.height - 2)).toBeNull();
    expect(dayAt(image, 0, 0)).toBeNull();
    expect(dayAt(image, -10, 400)).toBeNull();
  });
});
