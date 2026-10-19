import { renderPlant } from '../plant/renderPlant';
import { arrangeShelf, type ShelfItem } from '../shelf';
import { drawWallpaper, garlandBulbs } from './drawCorner';
import { drawWindow } from './drawWindow';
import { mirrorRows } from './drawFloor';
import { LIGHT_TONES, lightLevel, reflectLights, roomLights, type LightSource } from './lights';
import { composeRoom, planRoom } from './roomPlan';

const item = (id: string, species: string, day: number): ShelfItem => ({
  id,
  species,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

/** A tall room (grown plants), so that the lantern hangs on the last wall. */
function lights() {
  const species = ['monstera', 'ficus', 'bamboo', 'fern'];
  const items = species.map((s, i) => item(`t${i}`, s, i + 1));
  const plants = Object.fromEntries(
    species.map((s, i) => [
      `t${i}`,
      renderPlant({ species: s, seed: 7, elapsedDays: 120, relapseDays: [] }),
    ]),
  );
  const plan = planRoom({
    layout: arrangeShelf(items),
    plants,
    window: drawWindow('night'),
    pageWidth: 160,
    labelRows: 10,
  });
  const { lit, sources } = roomLights(
    plan,
    composeRoom(plan),
    drawWallpaper(plan.width, plan.height),
  );
  const cells = lit.pixels.flatMap((pixel, i) =>
    pixel?.tone ? [{ x: i % lit.width, y: Math.floor(i / lit.width), tone: pixel.tone }] : [],
  );
  return { plan, room: composeRoom(plan), lit, cells, sources };
}

describe('roomLights', () => {
  const { plan, lit, cells, sources } = lights();
  const of = (kind: LightSource['kind']) => sources.filter((source) => source.kind === kind);

  it('lights every bulb of the string of lights', () => {
    expect(of('bulb')).toHaveLength(garlandBulbs(plan.width).length);
    expect(cells.some((cell) => cell.tone === 'bulb')).toBe(true);
  });

  it('lights the lantern, the candle, the ember and the window, once each', () => {
    for (const kind of ['lantern', 'candle', 'ember', 'window'] as const) {
      expect(of(kind)).toHaveLength(1);
    }
    expect(cells.some((cell) => cell.tone === 'lampLight')).toBe(true);
    expect(cells.some((cell) => cell.tone === 'ember')).toBe(true);
  });

  it('keeps bright only what gives light, the size of the room', () => {
    expect(lit.width).toBe(plan.width);
    expect(lit.height).toBe(plan.height);
    for (const cell of cells) {
      expect(LIGHT_TONES.has(cell.tone)).toBe(true);
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x).toBeLessThan(plan.width);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeLessThan(plan.height);
    }
  });

  it('puts the ember glow on the ember, and the candle glow by the table', () => {
    const [ember] = of('ember');
    const near = cells.filter(
      (cell) => cell.tone === 'ember' && Math.abs(cell.x + 0.5 - ember!.x) < 1,
    );
    expect(near.some((cell) => Math.abs(cell.y + 0.5 - ember!.y) < 1)).toBe(true);
    const [candle] = of('candle');
    expect(Math.abs(candle!.x - ember!.x)).toBeLessThan(45);
  });
});

describe('lightLevel', () => {
  const { sources } = lights();

  it('stays between 0 and 1', () => {
    for (const source of sources) {
      for (let t = 0; t < 20; t += 0.37) {
        const level = lightLevel(source, t);
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is alive: every light changes with time', () => {
    for (const source of sources) {
      const levels = [0, 0.5, 1, 1.5, 2, 3].map((t) => lightLevel(source, t));
      expect(Math.max(...levels) - Math.min(...levels)).toBeGreaterThan(0.01);
    }
  });

  it('gives each bulb its own pace', () => {
    const bulbs = sources.filter((source) => source.kind === 'bulb').slice(0, 6);
    const now = bulbs.map((bulb) => lightLevel(bulb, 2).toFixed(3));
    expect(new Set(now).size).toBeGreaterThan(3);
  });

  it('flickers fast for the candle, breathes slowly for the lantern', () => {
    const swing = (source: LightSource) => {
      let total = 0;
      for (let t = 0.1; t < 2; t += 0.1) {
        total += Math.abs(lightLevel(source, t) - lightLevel(source, t - 0.1));
      }
      return total;
    };
    const candle = sources.find((source) => source.kind === 'candle')!;
    const lantern = sources.find((source) => source.kind === 'lantern')!;
    expect(swing(candle)).toBeGreaterThan(3 * swing(lantern));
  });
});

describe('reflectLights', () => {
  const { room, lit, sources } = lights();
  const rows = 40;
  const mirror = mirrorRows(room, rows);
  const reflection = reflectLights(room, rows, lit, sources);

  it('shows each lit cell low enough at its mirrored place in the floor, fading away', () => {
    expect(reflection.cells.length).toBeGreaterThan(0);
    for (const cell of reflection.cells) {
      const row = mirror.find((m) => m.y === cell.y)!;
      expect(lit.pixels[row.source * lit.width + cell.x]?.tone).toBe(cell.tone);
      expect(cell.alpha).toBeGreaterThan(0);
      expect(cell.alpha).toBeLessThan(1);
    }
  });

  it('mirrors the glows near the floor (the candle, the ember), weaker, not those up high', () => {
    const kinds = reflection.sources.map((source) => source.kind);
    expect(kinds).toContain('candle');
    expect(kinds).toContain('ember');
    expect(kinds).not.toContain('bulb');
    for (const source of reflection.sources) {
      expect(source.strength).toBeGreaterThan(0);
      expect(source.strength).toBeLessThanOrEqual(0.5);
      expect(source.y).toBeGreaterThanOrEqual(0);
      expect(source.y).toBeLessThanOrEqual(rows);
    }
  });
});
