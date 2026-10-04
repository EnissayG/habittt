// Générateur de plantes en pixel art — prototype de référence.
// Principe : plante = f(espèce, graine, jours, rechutes).
// Chaque jour ajoute des pixels à des positions qui dépendent seulement de la graine
// et de l'index du jour. Une rechute change la couleur des pixels de ce jour, jamais leur position.
(function (root) {
  const W = 48, H = 64, N = 120, CX = 24;
  const PAL = { d: '#5F7000', m: '#859900', l: '#A8BD2A', k: '#46580A', w: '#EEE8D5', s: '#FDF6E3', b: '#7A5230', f: '#D33682', r: '#DC322F', p: '#6C71C4', c: '#2AA198', cd: '#1F7A72', cl: '#5FC4B8' };
  const SICK = { d: '#946F00', m: '#B58900', l: '#D9B44A', k: '#7A5C00', w: '#E8D9A0', s: '#E8D9A0', b: '#C9A227', f: '#93A1A1', r: '#93A1A1', p: '#93A1A1', c: '#B58900', cd: '#946F00', cl: '#D9B44A' };
  const POTS = [['#CB4B16', '#A53C12'], ['#268BD2', '#1E6FA8'], ['#6C71C4', '#565A9D'], ['#D33682', '#A92B68'], ['#2AA198', '#22817A'], ['#93A1A1', '#768181']];
  const int = Math.floor;

  function rng(s) {
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function line(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const pts = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return pts;
  }
  function path(samples) {
    const out = [];
    for (let i = 1; i < samples.length; i++) {
      const seg = line(samples[i - 1][0], samples[i - 1][1], samples[i][0], samples[i][1]);
      for (let j = out.length ? 1 : 0; j < seg.length; j++) out.push(seg[j]);
    }
    return out;
  }
  function mk() {
    const plan = Array.from({ length: N }, () => []);
    return { plan, add(d, x, y, c) { if (d >= 0 && d < N) plan[d].push([Math.round(x), Math.round(y), c]); } };
  }
  function crown(add, T, a, b) {
    for (let x = CX - 5; x <= CX + 5; x++) add(0, x, T - 1, (x & 1) ? a : b);
    for (let x = CX - 3; x <= CX + 3; x++) add(0, x, T - 2, (x & 1) ? b : a);
  }

  function sansevieria(r, T) {
    const { plan, add } = mk(); let d = 0, k = 0;
    while (d < N) {
      const len = 7 + int(r() * 7), off = k ? Math.ceil(k / 2) * 3 * (k % 2 ? -1 : 1) : 0, lean = off / 18 + (r() - 0.5) * 0.4;
      for (let s = 0; s < len && d < N; s++, d++) for (let q = 0; q < 2; q++) {
        const h = s * 2 + q, y = T - 1 - h, x = CX + off + Math.round(lean * h / 3), band = h % 3 === 0 ? 'l' : 'm';
        if (s === len - 1 && q === 1) add(d, x, y, band);
        else if (s >= len - 2) { add(d, x, y, band); add(d, x + 1, y, 'd'); }
        else { add(d, x - 1, y, 'm'); add(d, x, y, band); add(d, x + 1, y, 'd'); }
      }
      k++;
    }
    return plan;
  }

  function pothos(r, T) {
    const { plan, add } = mk(); crown(add, T, 'm', 'l');
    const sx = [CX + 9, CX - 9, CX + 2], bias = [0.22, -0.22, 0], dr = [[], [], []], n = [0, 0, 0];
    for (let v = 0; v < 3; v++) { let x = 0; for (let j = 0; j < 70; j++) { if (j % 4 === 3) { const t = r() + bias[v]; x += t > 0.66 ? 1 : t < 0.33 ? -1 : 0; } dr[v][j] = x; } }
    for (let d = 0; d < N; d++) {
      const v = d < 30 ? 0 : d < 70 ? d % 2 : d % 3, m = n[v]++, t = int(m / 3), ph = m % 3, y0 = T + 2 + (v === 2 ? 9 : 0);
      const j = t * 2 + 1, x = sx[v] + dr[v][j], y = y0 + j, sd = t % 2 ? 1 : -1;
      if (ph === 0) { add(d, sx[v] + dr[v][j - 1], y - 1, 'd'); add(d, x, y, 'd'); }
      if (ph === 1) add(d, x + sd, y, 'l');
      if (ph === 2) { add(d, x + sd, y - 1, 'l'); add(d, x + 2 * sd, y - 1, 'm'); add(d, x + sd, y, 'm'); add(d, x + 2 * sd, y, 'm'); add(d, x + 3 * sd, y, 'd'); add(d, x + 2 * sd, y + 1, 'd'); }
    }
    return plan;
  }

  function bigleaf(style) {
    return function (r, T) {
      const { plan, add } = mk(); const hw = style.hw;
      for (let k = 0; k * 10 < N; k++) {
        const d0 = k * 10, side = k % 2 ? 1 : -1;
        const tx = CX + side * (style.reach + (k % 3) * style.step + int(r() * 3)), ty = T - 10 - int(k * 2.6) - int(r() * 3);
        const pet = line(CX + side * (k % 3), T - 1, tx, ty);
        pet.forEach((p, i) => add(d0 + int(i * 4 / pet.length), p[0], p[1], 'd'));
        const px = [];
        for (let i = 0; i < hw.length; i++) for (let dx = -hw[i]; dx <= hw[i]; dx++) {
          const y = ty - 1 - i, x = tx + dx + side * int(i / 3); let c;
          if (style.kind === 'monstera') {
            if (k >= 2 && i >= 2 && i <= 5 && Math.abs(dx) === 2 && i % 2 === 0) continue;
            if (k >= 4 && Math.abs(dx) === hw[i] && i % 2 === 1 && i <= 5) continue;
            c = dx === 0 ? 'd' : dx * side > 0 ? 'm' : 'l';
          } else {
            c = dx === 0 ? 'k' : (Math.abs(dx) === hw[i] && i < 4) ? 'p' : (i + Math.abs(dx)) % 2 ? 'l' : 'm';
          }
          px.push([x, y, c]);
        }
        px.forEach((p, i) => add(d0 + 4 + int(i * 6 / px.length), p[0], p[1], p[2]));
      }
      return plan;
    };
  }

  function spider(r, T) {
    const { plan, add } = mk();
    for (let k = 0; k * 4 < N; k++) {
      const d0 = k * 4, side = k % 2 ? 1 : -1, runner = k % 7 === 6;
      const L = runner ? 19 : 4 + r() * 14, hm = runner ? 15 : 8 + r() * 11, w = runner ? 3.0 : 2.6;
      const samples = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; samples.push([CX + side * (1 + L * t), T - 1 - hm * Math.sin(t * w)]); }
      const P = path(samples), base = k % 3 === 2 ? 'l' : 'm';
      P.forEach((p, i) => add(d0 + int(i * 4 / P.length), p[0], p[1], runner ? 'd' : (k % 3 === 1 && i % 3 === 1) ? 'w' : base));
      if (runner) { const e = P[P.length - 1]; [[0, 0, 's'], [-1, -1, 'm'], [1, -1, 'm'], [-1, 1, 'm'], [1, 1, 'm'], [0, -2, 'l'], [-2, 0, 'l'], [2, 0, 'l']].forEach(o => add(d0 + 3, e[0] + o[0], e[1] + o[1], o[2])); }
    }
    return plan;
  }

  function cactus(r, T) {
    const { plan, add } = mk(); const C3 = ['cd', 'c', 'cl'];
    const row3 = (d, cx, h) => C3.forEach((c, i) => add(d, cx - 1 + i, T - 1 - h, (i === 0 && h % 4 === 1) || (i === 2 && h % 4 === 3) ? 's' : c));
    const trunk = (d, h) => { add(d, CX - 1, T - 1 - h, 'c'); add(d, CX, T - 1 - h, 'cl'); add(d, CX + 1, T - 1 - h, 'c'); if (h > 0) { add(d, CX - 2, T - h, h % 4 === 1 ? 's' : 'cd'); add(d, CX + 2, T - h, h % 4 === 3 ? 's' : 'cd'); } };
    const a = 9 + int(r() * 4), b = 15 + int(r() * 4); let q = 0, fl = 0;
    const tops = [[CX, 0], [CX - 5, 0], [CX + 5, 0]];
    for (let d = 0; d < N; d++) {
      if (d < 30) trunk(d, d);
      else if (d < 33) for (let j = 0; j < 3; j++) add(d, CX - 3 - (d - 30), T - 1 - a - j, C3[2 - j]);
      else if (d < 50) row3(d, CX - 5, a + 3 + (d - 33));
      else if (d < 53) for (let j = 0; j < 3; j++) add(d, CX + 3 + (d - 50), T - 1 - b - j, C3[2 - j]);
      else if (d < 65) row3(d, CX + 5, b + 3 + (d - 53));
      else if (d < 75) trunk(d, 30 + d - 65);
      else if ((d - 75) % 5 === 0) {
        const t = fl % 3, o = int(fl / 3) - 1; fl++;
        const ty = t === 0 ? T - 1 - 39 : t === 1 ? T - 1 - (a + 19) : T - 1 - (b + 14);
        add(d, tops[t][0] + o, ty - 1, 'f'); if (o === 0) add(d, tops[t][0], ty - 2, 'f');
      } else {
        if (q < 8) row3(d, CX - 5, q); else if (q < 16) row3(d, CX + 5, q - 8);
        else add(d, CX - 1 + int(r() * 3), T - 2 - int(r() * 36), 's');
        q++;
      }
    }
    return plan;
  }

  function aloe(r, T) {
    const { plan, add } = mk();
    for (let k = 0; k * 6 < N; k++) {
      const d0 = k * 6, side = k % 2 ? 1 : -1, a = Math.max(0.08, 1.25 - 0.12 * int(k / 2) + (r() - 0.5) * 0.1), Ln = 11 + int(r() * 4) + int(k / 2);
      for (let p = 0; p < Ln; p++) {
        const x = Math.round(CX + side * Math.sin(a) * p), y = Math.round(T - 1 - Math.cos(a) * p - (p * p / (Ln * 2.2)) * Math.sin(a));
        const d = d0 + int(p * 6 / Ln), th = p < Ln * 0.5 ? 1 : 0;
        add(d, x, y, p > Ln * 0.8 ? 'cl' : 'c');
        if (p < Ln * 0.8) add(d, x + side, y, p % 5 === 2 ? 'cl' : 'cd');
        if (th) add(d, x - side, y, 'cl');
      }
    }
    return plan;
  }

  function fern(r, T) {
    const { plan, add } = mk();
    for (let k = 0; k * 8 < N; k++) {
      const d0 = k * 8, side = k % 2 ? 1 : -1, L = 7 + r() * 13, hm = 9 + r() * 13 + k * 0.6, samples = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; samples.push([CX + side * (1 + L * t), T - 1 - hm * Math.sin(t * 2.4)]); }
      const P = path(samples);
      P.forEach((p, i) => {
        const d = d0 + int(i * 8 / P.length); add(d, p[0], p[1], 'd');
        if (i > 2 && i % 2 === 0 && i < P.length - 2) {
          const vert = P[i + 1][0] !== p[0], long = i % 4 === 0 && i < P.length - 6;
          if (vert) { add(d, p[0], p[1] - 1, 'm'); add(d, p[0], p[1] + 1, 'm'); if (long) { add(d, p[0], p[1] - 2, 'l'); add(d, p[0], p[1] + 2, 'l'); } }
          else { add(d, p[0] - 1, p[1], 'm'); add(d, p[0] + 1, p[1], 'm'); if (long) { add(d, p[0] - 2, p[1], 'l'); add(d, p[0] + 2, p[1], 'l'); } }
        }
      });
    }
    return plan;
  }

  function ficus(r, T) {
    const { plan, add } = mk(); const dr = []; let x = 0;
    for (let j = 0; j < 60; j++) { if (j % 6 === 5) { const t = r(); x += t > 0.7 ? 1 : t < 0.3 ? -1 : 0; x = Math.max(-2, Math.min(2, x)); } dr[j] = x; }
    for (let d = 0; d < N; d++) {
      const c = int(d / 5), ph = d % 5, j = 2 * c + 1, sx = CX + dr[j], y = T - 1 - j, sd = c % 2 ? 1 : -1;
      if (ph === 0) add(d, CX + dr[j - 1], y + 1, 'b');
      if (ph === 1) { add(d, sx, y, 'b'); add(d, sx + sd, y, 'r'); }
      if (ph === 2) { for (let i = 1; i <= 3; i++) add(d, sx + sd * i, y, 'k'); add(d, sx + sd * 2, y - 1, 'd'); add(d, sx + sd * 3, y - 1, 'd'); add(d, sx + sd * 2, y + 1, 'k'); add(d, sx + sd * 3, y + 1, 'k'); }
      if (ph === 3) { add(d, sx + sd * 4, y, 'k'); add(d, sx + sd * 5, y, 'd'); add(d, sx + sd * 4, y - 1, 'd'); add(d, sx + sd * 4, y + 1, 'k'); }
      if (ph === 4) { add(d, sx + sd * 2, y - 1, 'l'); add(d, sx + sd * 3, y - 1, 'm'); }
    }
    return plan;
  }

  function bamboo(r, T) {
    const { plan, add } = mk(); const xs = [CX - 6, CX - 1, CX + 4], order = [0, 1, 2, 0, 1, 0, 1, 2], n = [0, 0, 0], ph = [int(r() * 6), int(r() * 6), int(r() * 6)];
    for (let d = 0; d < N; d++) {
      const v = order[d % 8], h = n[v]++, x = xs[v], y = T - 1 - h, node = (h + ph[v]) % 6 === 5;
      add(d, x, y, node ? 'd' : 'l'); add(d, x + 1, y, node ? 'd' : 'm');
      if (node) { const sd = ((h + ph[v] + 1) / 6) % 2 ? 1 : -1, bx = sd > 0 ? x + 2 : x - 1; add(d, bx, y - 1, 'm'); add(d, bx + sd, y - 2, 'l'); add(d, bx + 2 * sd, y - 2, 'm'); }
    }
    return plan;
  }

  function pearls(r, T) {
    const { plan, add } = mk(); crown(add, T, 'l', 'm');
    const offs = [-15, -12, -9, 9, 12, 15], n = [0, 0, 0, 0, 0, 0], y0 = offs.map(() => T + 1 + int(r() * 2)), phs = offs.map(() => r() * 6);
    for (let d = 0; d < N; d++) {
      const v = (d * 5) % 6, m = n[v]++, x = CX + offs[v] + Math.round(Math.sin(m * 0.5 + phs[v])), y = y0[v] + int(m * 2.6);
      if (m === 0) for (const q of line(CX + Math.sign(offs[v]) * 6, T - 1, x, y)) add(d, q[0], q[1], 'd');
      add(d, x, y, 'l'); add(d, x + 1, y, 'm'); add(d, x, y + 1, 'm'); add(d, x + 1, y + 1, 'd');
    }
    return plan;
  }

  function bonsai(r, T) {
    const { plan, add } = mk(); const steps = [], q = [{ x: CX, y: T - 1, a: -Math.PI / 2 + (r() - 0.5) * 0.3, len: 10, dp: 0 }];
    while (q.length) {
      const s = q.shift(), x1 = s.x + Math.cos(s.a) * s.len, y1 = s.y + Math.sin(s.a) * s.len, pts = line(s.x, s.y, x1, y1);
      pts.forEach((p, i) => steps.push({ x: p[0], y: p[1], dp: s.dp, end: i === pts.length - 1 }));
      if (s.dp < 4) [-1, 1].forEach(sg => q.push({ x: x1, y: y1, a: Math.max(-2.7, Math.min(-0.45, s.a + sg * (0.45 + r() * 0.35))), len: Math.max(5, s.len * 0.8), dp: s.dp + 1 }));
    }
    let si = 0; const ends = [];
    const grow = d => { const s = steps[si]; if (!s) return false; si++; add(d, s.x, s.y, 'b'); if (s.dp <= 1) add(d, s.x + 1, s.y, 'b'); if (s.dp === 0) add(d, s.x - 1, s.y, 'b'); if (s.end && s.dp >= 1) ends.push(s); return true; };
    const leaf = d => { const e = ends[ends.length - 1 - int(r() * r() * ends.length)], x = e.x + int(r() * 5) - 2, y = e.y + int(r() * 4) - 3; add(d, x, y, 'l'); add(d, x + 1, y, 'm'); add(d, x, y + 1, 'm'); add(d, x + 1, y + 1, 'd'); };
    for (let d = 0; d < N; d++) {
      if (d % 2 === 0 || !ends.length) { const a = grow(d), b = grow(d); if (!a && !b && ends.length) leaf(d); }
      else leaf(d);
    }
    return plan;
  }

  const SPECIES = {
    sansevieria: { name: 'Sansevieria', note: 'Des lames qui montent une à une', build: sansevieria },
    pothos: { name: 'Pothos', note: 'Une liane qui retombe de la tablette', hang: true, build: pothos },
    monstera: { name: 'Monstera', note: 'Les trous apparaissent avec la maturité', build: bigleaf({ kind: 'monstera', hw: [1, 3, 4, 4, 4, 3, 2, 1], reach: 3, step: 4 }) },
    spider: { name: 'Plante araignée', note: 'Des bébés au bout de longues tiges', build: spider },
    cactus: { name: 'Cactus', note: 'Un tronc, des bras, puis des fleurs', build: cactus },
    aloe: { name: 'Aloès', note: 'Une rosette qui se resserre vers le centre', build: aloe },
    fern: { name: 'Fougère', note: 'Des frondes en arc, plume par plume', build: fern },
    ficus: { name: 'Caoutchouc', note: 'Une tige droite, une feuille à la fois', build: ficus },
    bamboo: { name: 'Bambou', note: 'Trois cannes qui montent à leur rythme', build: bamboo },
    pearls: { name: 'Collier de perles', note: 'Une perle par jour', hang: true, build: pearls },
    calathea: { name: 'Calathea', note: 'Des feuilles rayées bordées de violet', build: bigleaf({ kind: 'calathea', hw: [1, 2, 3, 3, 3, 3, 2, 2, 1], reach: 2, step: 3 }) },
    bonsai: { name: 'Arbre de jade', note: 'Des branches, puis le feuillage', build: bonsai },
  };

  function render(key, seed, days, relapses) {
    const sp = SPECIES[key], T = sp.hang ? 8 : 50, r = rng(hash(key) ^ Math.imul(seed | 0, 2654435761));
    const pot = POTS[int(r() * POTS.length)], grid = new Array(W * H).fill(null);
    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c; };
    for (let x = CX - 6; x <= CX + 6; x++) set(x, T, '#5B4636');
    for (let y = T + 1; y <= T + 10; y++) { const hw = y <= T + 2 ? 7 : 6 - int((y - T - 3) / 3); for (let x = CX - hw; x <= CX + hw; x++) set(x, y, x > CX + hw - 3 ? pot[1] : pot[0]); }
    for (let x = 0; x < W; x++) { set(x, T + 11, '#B58900'); set(x, T + 12, '#B58900'); set(x, T + 13, '#93710A'); }
    const plan = sp.build(r, T), rel = new Set(relapses || []), dayAt = new Array(W * H).fill(0);
    const inPot = (x, y) => y > T && y <= T + 10 && Math.abs(x - CX) <= (y <= T + 2 ? 7 : 6 - int((y - T - 3) / 3));
    for (let d = 0; d < Math.min(days, N); d++) { const pal = rel.has(d + 1) ? SICK : PAL; for (const p of plan[d]) { if (inPot(p[0], p[1]) || p[0] < 0 || p[1] < 0 || p[0] >= W || p[1] >= H) continue; set(p[0], p[1], pal[p[2]]); dayAt[p[1] * W + p[0]] = d + 1; } }
    return { w: W, h: H, grid, dayAt };
  }

  const api = { W, H, MAX_DAYS: N, SPECIES, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PlantLab = api;
})(typeof window !== 'undefined' ? window : globalThis);
