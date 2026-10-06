import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import { contrastRatio } from './contrast';
import { sceneColor } from './scenePalette';
import { colors, FLOOR_MARKS, MIN_TEXT_CONTRAST, TEXT_PAIRS } from './tokens';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // Known Solarized pair: base01 on base3.
    expect(contrastRatio('#586E75', '#FDF6E3')).toBeCloseTo(4.99, 2);
  });
});

describe('theme text contrast', () => {
  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (text, background) => {
    expect(contrastRatio(colors[text], colors[background])).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });

  // Pairs are only safe if screens stick to them: text may only be colored
  // with the roles that appear as text in TEXT_PAIRS.
  it('screens color text only with allowed text roles', () => {
    const allowed = new Set(TEXT_PAIRS.map(([text]) => text));
    const uiDir = join(__dirname, '..');
    const offenders: string[] = [];

    const visit = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) visit(path);
        else if (path.endsWith('.tsx')) {
          const source = readFileSync(path, 'utf8');
          for (const match of source.matchAll(
            /(?:\bcolor|placeholderTextColor)[:=]\s*\{?colors\.(\w+)/g,
          )) {
            if (!allowed.has(match[1] as never)) offenders.push(`${name}: colors.${match[1]}`);
          }
        }
      }
    };
    visit(uiDir);

    expect(offenders).toEqual([]);
  });
});

describe('floor marks contrast', () => {
  const planks = (['plank0', 'plank1', 'plank2'] as const).map((tone) =>
    sceneColor({ tone, layers: [] }, 'day'),
  );
  it.each(FLOOR_MARKS)('%s stands out on every plank (at least 3:1)', (role) => {
    for (const plank of planks)
      expect(contrastRatio(colors[role], plank)).toBeGreaterThanOrEqual(3);
  });
});
