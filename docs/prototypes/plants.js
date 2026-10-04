// Générateur de plantes en pixel art — prototype de référence.
// Principe : plante = f(espèce, graine, jours, rechutes).
// Chaque jour ajoute des pixels à des positions qui dépendent seulement de la graine
// et de l'index du jour. Une rechute change la couleur des pixels de ce jour, jamais leur position.
(function (root) {
  const W = 48, H = 64, N = 120, CX = 24;
  const PAL = { e: '#D8E08A', bd: '#5E3D22', d: '#5F7000', m: '#859900', l: '#A8BD2A', k: '#46580A', w: '#EEE8D5', s: '#FDF6E3', b: '#7A5230', f: '#D33682', r: '#DC322F', p: '#6C71C4', c: '#2AA198', cd: '#1F7A72', cl: '#5FC4B8' };
  const SICK = { e: '#D9B44A', bd: '#946F00', d: '#946F00', m: '#B58900', l: '#D9B44A', k: '#7A5C00', w: '#E8D9A0', s: '#E8D9A0', b: '#C9A227', f: '#93A1A1', r: '#93A1A1', p: '#93A1A1', c: '#B58900', cd: '#946F00', cl: '#D9B44A' };
  const POTS = [['#CB4B16', '#A53C12'], ['#268BD2', '#1E6FA8'], ['#6C71C4', '#565A9D'], ['#D33682', '#A92B68'], ['#2AA198', '#22817A'], ['#93A1A1', '#768181']];
  const int = Math.floor;
  // Ce que la graine fait varier, en plus de la forme propre à chaque espèce.
  const FOLIAGE = [
    { name: 'vert classique', w: 40, l: '#A8BD2A', m: '#859900', d: '#5F7000', k: '#46580A', c: '#2AA198', cd: '#1F7A72', cl: '#5FC4B8' },
    { name: 'vert forêt', w: 22, l: '#7FA650', m: '#4F8A3C', d: '#356B2E', k: '#234F22', c: '#3F8F5A', cd: '#2C6E44', cl: '#6FB884' },
    { name: 'vert tendre', w: 22, l: '#C9D64A', m: '#A3B818', d: '#7A8C0C', k: '#5C6B08', c: '#8FAE3A', cd: '#6C8A22', cl: '#B5CC66' },
    { name: 'vert bleuté', w: 16, l: '#7FC4A8', m: '#3F9E82', d: '#2A7862', k: '#1C5A49', c: '#4A90B8', cd: '#356F92', cl: '#7DB6D6' },
  ];
  const TRAITS = [
    { name: '', w: 80 },
    { name: 'panaché', w: 14, v: '#E6EBA8', pct: 16 },
    { name: 'rosé', w: 5, v: '#E79AB8', pct: 14 },
    { name: 'doré', w: 1, v: '#E0B030', pct: 22 },
  ];
  const POT_SHAPES = [
    { name: 'évasé', hw: [7, 7, 6, 6, 6, 5, 5, 5, 4, 4] },
    { name: 'droit', hw: [7, 7, 6, 6, 6, 6, 6, 6, 6, 6] },
    { name: 'rond', hw: [6, 7, 7, 7, 7, 7, 6, 6, 5, 4] },
  ];
  const TRAY = { name: 'plateau', hw: [10, 10, 9, 9, 9, 8, 0, 0, 0, 0] };
  const POT_BANDS = ['uni', 'à bande', 'à pois'];
  const POT_NAMES = ['terre cuite', 'bleu', 'violet', 'rose', 'turquoise', 'gris'];
  function pick(list, x) { let t = 0; for (const o of list) t += o.w; let v = x * t; for (const o of list) { if ((v -= o.w) < 0) return o; } return list[0]; }
  function genome(key, seed) {
    const g = rng(hash(key + '#genome') ^ Math.imul(seed | 0, 40503));
    const pot = int(g() * POTS.length), shape = int(g() * POT_SHAPES.length), band = int(g() * POT_BANDS.length);
    return { pot, shape, band, mirror: g() < 0.5, foliage: pick(FOLIAGE, g()), trait: pick(TRAITS, g()), salt: int(g() * 65536) };
  }

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
  const choose = (r, list) => list[int(r() * list.length)];
  // Répartit les jours entre plusieurs tiges, avec des poids tirés de la graine, sans dépasser la place disponible.
  function lanes(r, n, cap, maxW) {
    const order = []; for (let v = 0; v < n; v++) { const w = 1 + int(r() * maxW); for (let i = 0; i < w; i++) order.push(v); }
    for (let i = order.length - 1; i > 0; i--) { const j = int(r() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    const used = new Array(n).fill(0); let p = 0;
    return () => { for (let t = 0; t < order.length; t++) { const v = order[(p + t) % order.length]; if (used[v] < cap(v)) { p += t + 1; used[v]++; return v; } } const v = order[p++ % order.length]; used[v]++; return v; };
  }
  function crown(add, T, a, b) {
    for (let x = CX - 5; x <= CX + 5; x++) add(0, x, T - 1, (x & 1) ? a : b);
    for (let x = CX - 3; x <= CX + 3; x++) add(0, x, T - 2, (x & 1) ? b : a);
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
          } else if (style.kind === 'lance') {
            c = dx === 0 ? 'k' : (i % 3 === 1 && Math.abs(dx) === 1) ? 'k' : Math.abs(dx) === hw[i] && i < 3 ? 'p' : 'm';
          } else if (style.kind === 'orbi') {
            c = dx === 0 || Math.abs(dx) === hw[i] ? 'd' : i % 2 ? 'e' : 'm';
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

  function aloe(r, T) {
    const { plan, add } = mk(); const close = 0.08 + r() * 0.08, baseL = 8 + int(r() * 7);
    for (let k = 0; k * 6 < N; k++) {
      const d0 = k * 6, side = k % 2 ? 1 : -1, a = Math.max(0.08, 1.25 - close * int(k / 2) + (r() - 0.5) * 0.1), Ln = baseL + int(r() * 4) + int(k / 2);
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

  function jade(r, T) {
    const { plan, add } = mk(); const fork = 0.3 + r() * 0.4, steps = [], q = [{ x: CX, y: T - 1, a: -Math.PI / 2 + (r() - 0.5) * 0.55, len: 7 + int(r() * 5), dp: 0 }];
    while (q.length) {
      const s = q.shift(), x1 = s.x + Math.cos(s.a) * s.len, y1 = s.y + Math.sin(s.a) * s.len, pts = line(s.x, s.y, x1, y1);
      pts.forEach((p, i) => steps.push({ x: p[0], y: p[1], dp: s.dp, end: i === pts.length - 1 }));
      if (s.dp < 4) [-1, 1].forEach(sg => q.push({ x: x1, y: y1, a: Math.max(-2.7, Math.min(-0.45, s.a + sg * (fork + r() * 0.35))), len: Math.max(5, s.len * 0.8), dp: s.dp + 1 }));
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

  function sansevieria(r, T) {
    const { plan, add } = mk(); const V = choose(r, ['Trifasciata', 'Trifasciata', 'Laurentii', 'Laurentii', 'Cylindrica', 'Hahnii']); plan.variety = V;
    const cyl = V === 'Cylindrica', hah = V === 'Hahnii', edge = V === 'Laurentii' ? 'e' : 'd', fan = 0.4 + r() * 0.9; let d = 0, k = 0;
    while (d < N) {
      const len = hah ? 3 + int(r() * 3) : cyl ? 10 + int(r() * 9) : 6 + int(r() * 9);
      const off = hah ? ((k * 5) % 9 - 4) * 2 : (k ? Math.min(7, Math.ceil(k / 2)) * (cyl ? 2 : 3) * (k % 2 ? -1 : 1) : 0);
      const lean = Math.max(-1.05, Math.min(1.05, (hah ? off / 5 : off / 16 * fan) + (r() - 0.5) * 0.4)), hwid = hah ? 2 : 1;
      for (let s = 0; s < len && d < N; s++, d++) for (let q = 0; q < 2; q++) {
        const h = s * 2 + q, y = T - 1 - h, x = CX + off + Math.round(lean * h / 3), band = edge === 'e' ? (h % 3 === 0 ? 'm' : 'd') : h % 3 === 0 ? 'l' : 'm', left = len * 2 - h;
        if (cyl) { add(d, x, y, h % 5 === 4 ? 'd' : 'm'); if (left > 3) add(d, x + 1, y, 'd'); }
        else { const w = left <= 1 ? 0 : left <= 3 ? hwid - 1 : hwid; for (let dx = -w; dx <= w; dx++) add(d, x + dx, y, w > 0 && Math.abs(dx) === w ? (dx < 0 && edge === 'd' ? 'm' : edge) : band); }
      }
      k++;
    }
    return plan;
  }

  function pothos(r, T) {
    const { plan, add } = mk(); crown(add, T, 'm', 'l');
    const big = r() < 0.5, step = big ? 3 : 2, nV = big ? 3 + int(r() * 2) : 2 + int(r() * 3); plan.variety = big ? 'à grandes feuilles' : 'à petites feuilles';
    const anchors = [[CX + 9, 0, 0.22], [CX - 9, 0, -0.22], [CX + 3, 11, 0.1], [CX - 4, 11, -0.1]].slice(0, nV), dr = [], n = anchors.map(() => 0);
    anchors.forEach((a, v) => { let x = 0; dr[v] = []; for (let j = 0; j < 70; j++) { if (j % 4 === 3) { const t = r() + a[2]; x += t > 0.66 ? 1 : t < 0.33 ? -1 : 0; } dr[v][j] = x; } });
    const next = lanes(r, nV, v => int((H - 4 - T - 2 - anchors[v][1]) / step) * 3, 3);
    for (let d = 0; d < N; d++) {
      const v = d < 9 ? (next(), 0) : next(), a = anchors[v], m = n[v]++, t = int(m / 3), ph = m % 3, j = t * step + step - 1, x = a[0] + dr[v][j], y = T + 2 + a[1] + j, sd = t % 2 ? 1 : -1;
      if (ph === 0) for (let q = 0; q < step; q++) add(d, a[0] + dr[v][j - q], y - q, 'd');
      if (ph === 1) add(d, x + sd, y, 'l');
      if (ph === 2 && big) { add(d, x + sd, y - 1, 'l'); add(d, x + 2 * sd, y - 1, 'm'); add(d, x + 2 * sd, y, 'm'); add(d, x + 3 * sd, y, 'd'); add(d, x + 2 * sd, y + 1, 'd'); }
      if (ph === 2 && !big) { add(d, x + sd, y - 1, 'm'); add(d, x + 2 * sd, y, 'd'); }
    }
    return plan;
  }

  function monstera(r, T) {
    const { plan, add } = mk(); const adan = r() < 0.4; plan.variety = adan ? 'Adansonii' : 'Deliciosa';
    const SHAPE = adan ? [2, 3, 4, 4, 4, 4, 4, 3, 3, 2, 1] : [3, 5, 6, 7, 7, 7, 6, 6, 5, 4, 3, 2, 1], per = adan ? 7 : 10, wide = 0.75 + r() * 0.6, grow = adan ? 1.55 : 2.5;
    for (let k = 0; k * per < N; k++) {
      const d0 = k * per, side = k % 2 ? 1 : -1, sc = Math.min(1, (adan ? 0.6 : 0.45) + k * 0.065);
      const rows = Math.max(5, Math.round(SHAPE.length * sc));
      const spread = ([0.2, 0.62, 1.0][k % 3] + (r() - 0.5) * 0.16) * wide, R = 9 + k * grow + r() * 2;
      const tx = Math.max(8, Math.min(W - 9, Math.round(CX + side * R * Math.sin(spread)))), ty = Math.max(3, Math.round(T - 1 - R * Math.cos(spread) * 0.95));
      const mx = CX + side * (1 + k % 3), samples = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; samples.push([mx + (tx - mx) * t * t, T - 1 + (ty - (T - 1)) * (1 - (1 - t) * (1 - t))]); }
      const pet = path(samples), cut = int(per * 0.4);
      pet.forEach((p, i) => add(d0 + int(i * cut / pet.length), p[0], p[1], 'd'));
      const px = [];
      for (let i = 0; i < rows; i++) {
        const hw = Math.max(1, Math.round(SHAPE[Math.min(SHAPE.length - 1, Math.round(i / sc))] * sc)), y = ty + i, lean = side * int(i / 4);
        for (let dx = -hw; dx <= hw; dx++) {
          const ax = Math.abs(dx), x = tx + dx + lean;
          if (i === 0 && ax === 0) continue;
          if (adan) { if (k >= 1 && ax >= 1 && ax <= hw - 1 && (i + ax * 2) % 3 === 0 && i > 0 && i < rows - 2) continue; }
          else {
            if (k >= 3 && ax >= 2 && ax <= hw - 2 && (i + ax) % 3 === 0 && i > 0 && i < rows - 3) continue;
            if (k >= 6 && ax === hw && i % 3 === 1 && i > 1 && i < rows - 2) continue;
          }
          px.push([x, y, ax === hw ? 'k' : ax === 0 ? 'd' : dx * side < 0 ? 'l' : 'm']);
        }
      }
      px.forEach((p, i) => add(d0 + cut + int(i * (per - cut) / px.length), p[0], p[1], p[2]));
    }
    return plan;
  }

  function spider(r, T) {
    const { plan, add } = mk(); const curly = r() < 0.35, every = 5 + int(r() * 5), reach = 0.7 + r() * 0.6, edgeStripe = r() < 0.5;
    plan.variety = curly ? 'Bonnie (frisée)' : edgeStripe ? 'Variegatum' : 'Vittatum';
    for (let k = 0; k * 4 < N; k++) {
      const d0 = k * 4, side = k % 2 ? 1 : -1, runner = k % every === every - 1;
      const L = (runner ? 19 : 4 + r() * 14) * (curly && !runner ? 0.6 : reach), hm = runner ? 15 : (8 + r() * 11) * (curly ? 0.8 : 1), w = runner ? 3.0 : curly ? 3.3 : 2.6;
      const samples = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; samples.push([CX + side * (1 + Math.min(21, L) * t), Math.min(T - 1, T - 1 - hm * Math.sin(t * w))]); }
      const P = path(samples), base = k % 3 === 2 ? 'l' : 'm';
      P.forEach((p, i) => add(d0 + int(i * 4 / P.length), p[0], p[1], runner ? 'd' : (edgeStripe ? k % 2 === 0 && i % 2 === 0 : k % 3 === 1 && i % 3 === 1) ? 'w' : base));
      if (runner) { const e = P[P.length - 1]; [[0, 0, 's'], [-1, -1, 'm'], [1, -1, 'm'], [-1, 1, 'm'], [1, 1, 'm'], [0, -2, 'l'], [-2, 0, 'l'], [2, 0, 'l']].forEach(o => add(d0 + 3, e[0] + o[0], e[1] + o[1], o[2])); }
    }
    return plan;
  }

  function saguaro(r, T, plan, add) {
    const C3 = ['cd', 'c', 'cl'];
    const row3 = (d, cx, h) => C3.forEach((c, i) => add(d, cx - 1 + i, T - 1 - h, (i === 0 && h % 4 === 1) || (i === 2 && h % 4 === 3) ? 's' : c));
    const trunk = (d, h) => { add(d, CX - 1, T - 1 - h, 'c'); add(d, CX, T - 1 - h, 'cl'); add(d, CX + 1, T - 1 - h, 'c'); if (h > 0) { add(d, CX - 2, T - h, h % 4 === 1 ? 's' : 'cd'); add(d, CX + 2, T - h, h % 4 === 3 ? 's' : 'cd'); } };
    const a = 6 + int(r() * 10), b = 11 + int(r() * 10); let q = 0, fl = 0;
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
  }
  function cierges(r, T, plan, add) {
    const nC = 3 + int(r() * 2), xs = [], hs = new Array(nC).fill(0), C3 = ['cd', 'c', 'cl'];
    for (let i = 0; i < nC; i++) xs.push(Math.round(CX + (i - (nC - 1) / 2) * 5));
    const next = lanes(r, nC, () => 40, 4);
    for (let d = 0; d < N; d++) {
      if (d >= 108) { const i = (d - 108) % nC, o = int((d - 108) / nC); add(d, xs[i] + [0, -1, 1, 0][o], T - 2 - hs[i] + (o === 3 ? -1 : 0), 'f'); continue; }
      const i = next(), h = hs[i]++;
      C3.forEach((c, j) => add(d, xs[i] - 1 + j, T - 1 - h, (j === 0 && h % 4 === 1) || (j === 2 && h % 4 === 3) ? 's' : c));
    }
  }
  function opuntia(r, T, plan, add) {
    const HW = [1, 2, 3, 3, 3, 3, 3, 2, 1], pads = [{ x: CX, y: T - 1, kids: 0 }];
    for (let k = 0; k * 10 < N; k++) {
      let p;
      if (k === 0) p = pads[0];
      else {
        const open = pads.filter(q => q.kids < 2 && q.y - 7 > 12), par = open[int(r() * open.length)] || pads[pads.length - 1];
        const sd = par.kids === 0 ? (r() < 0.5 ? -1 : 1) : -par.first; if (par.kids === 0) par.first = sd; par.kids++;
        p = { x: Math.max(5, Math.min(W - 6, par.x + sd * (3 + int(r() * 2)))), y: par.y - 7, kids: 0 }; pads.push(p);
      }
      const px = [];
      for (let i = 0; i < HW.length; i++) for (let dx = -HW[i]; dx <= HW[i]; dx++) px.push([p.x + dx, p.y - i, Math.abs(dx) === HW[i] ? 'cd' : (i % 3 === 1 && dx % 2 === 0) ? 's' : dx < 0 ? 'cl' : 'c']);
      px.forEach((q, i) => add(k * 10 + int(i * 9 / px.length), q[0], q[1], q[2]));
      add(k * 10 + 9, p.x, p.y - HW.length, k >= 6 ? 'f' : 'cl'); if (k >= 6) add(k * 10 + 9, p.x + 1, p.y - HW.length, 'f');
    }
  }
  function cactus(r, T) {
    const { plan, add } = mk(); const V = choose(r, ['Saguaro', 'Saguaro', 'Cierges', 'Figuier de Barbarie', 'Figuier de Barbarie']); plan.variety = V;
    (V === 'Saguaro' ? saguaro : V === 'Cierges' ? cierges : opuntia)(r, T, plan, add);
    return plan;
  }

  function fern(r, T) {
    const { plan, add } = mk(); const hair = r() < 0.35, droop = 1.7 + r() * 1.3, scale = 0.75 + r() * 0.45; plan.variety = hair ? 'Capillaire' : droop > 2.5 ? 'de Boston (retombante)' : 'de Boston (dressée)';
    for (let k = 0; k * 8 < N; k++) {
      const d0 = k * 8, side = k % 2 ? 1 : -1, L = Math.min(21, (7 + r() * 13) * scale), hm = (9 + r() * 13 + k * 0.6) * (droop > 2.5 ? 0.8 : 1.15), samples = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; samples.push([CX + side * (1 + L * t), Math.max(2, T - 1 - hm * Math.sin(t * droop))]); }
      const P = path(samples);
      P.forEach((p, i) => {
        const d = d0 + int(i * 8 / P.length); add(d, p[0], p[1], hair ? 'k' : 'd');
        if (i > 2 && i % 2 === 0 && i < P.length - 2) {
          const vert = P[i + 1][0] !== p[0], long = !hair && i % 4 === 0 && i < P.length - 6, t1 = hair ? 'l' : 'm';
          if (hair) { const o = i % 4 === 0 ? -1 : 1; if (vert) { add(d, p[0], p[1] + o, 'l'); add(d, p[0] + 1, p[1] + 2 * o, 'm'); } else { add(d, p[0] + o, p[1], 'l'); add(d, p[0] + 2 * o, p[1] - 1, 'm'); } }
          else if (vert) { add(d, p[0], p[1] - 1, t1); add(d, p[0], p[1] + 1, t1); if (long) { add(d, p[0], p[1] - 2, 'l'); add(d, p[0], p[1] + 2, 'l'); } }
          else { add(d, p[0] - 1, p[1], t1); add(d, p[0] + 1, p[1], t1); if (long) { add(d, p[0] - 2, p[1], 'l'); add(d, p[0] + 2, p[1], 'l'); } }
        }
      });
    }
    return plan;
  }

  function ficus(r, T) {
    const { plan, add } = mk(); const dr = [], bias = (r() - 0.5) * 0.5, split = r() < 0.5 ? 5 + int(r() * 5) : 99, long = r() < 0.5; let x = 0;
    plan.variety = (split < 99 ? 'ramifié' : 'à tige unique') + (long ? ', longues feuilles' : '');
    for (let j = 0; j < 60; j++) { if (j % 4 === 3) { const t = r() + bias; x += t > 0.7 ? 1 : t < 0.3 ? -1 : 0; x = Math.max(-5, Math.min(5, x)); } dr[j] = x; }
    for (let d = 0; d < N; d++) {
      const c = int(d / 5), ph = d % 5; let j, sx, sd, px;
      if (c < split) { j = 2 * c + 1; sx = CX + dr[j]; px = CX + dr[j - 1]; sd = c % 2 ? 1 : -1; }
      else { const e = c - split, s = e % 2 ? 1 : -1, i = int(e / 2), b = 2 * split; j = b + 1 + 2 * i; sx = CX + dr[b] + s * (2 + Math.min(i, 4)) + (dr[j] - dr[b]); px = i === 0 ? CX + dr[b] + s : CX + dr[b] + s * (2 + Math.min(i - 1, 4)) + (dr[j - 2] - dr[b]); sd = s; }
      const y = T - 1 - j, e1 = long ? 6 : 5;
      if (ph === 0) { add(d, px, y + 1, 'b'); if (px !== sx) add(d, sx, y + 1, 'b'); }
      if (ph === 1) { add(d, sx, y, 'b'); add(d, sx + sd, y, 'r'); }
      if (ph === 2) { for (let i = 1; i <= 3; i++) add(d, sx + sd * i, y, 'k'); add(d, sx + sd * 2, y - 1, 'd'); add(d, sx + sd * 3, y - 1, 'd'); add(d, sx + sd * 2, y + 1, 'k'); add(d, sx + sd * 3, y + 1, 'k'); }
      if (ph === 3) { for (let i = 4; i < e1; i++) { add(d, sx + sd * i, y, 'k'); add(d, sx + sd * i, y - 1, 'd'); if (i < e1 - 1 || !long) add(d, sx + sd * i, y + 1, 'k'); } add(d, sx + sd * e1, y, 'd'); }
      if (ph === 4) { add(d, sx + sd * 2, y - 1, 'l'); add(d, sx + sd * 3, y - 1, 'm'); }
    }
    return plan;
  }

  function bamboo(r, T) {
    const { plan, add } = mk(); const nC = 3 + int(r() * 3), spiral = r() < 0.35, xs = [], n = new Array(nC).fill(0), ph = [];
    plan.variety = (spiral ? 'spirale, ' : '') + nC + ' cannes';
    for (let i = 0; i < nC; i++) { xs.push(Math.round(CX - 1 + (i - (nC - 1) / 2) * (nC > 4 ? 4 : 5))); ph.push(int(r() * 6)); }
    const next = lanes(r, nC, () => 46, 4);
    for (let d = 0; d < N; d++) {
      const v = next(), h = n[v]++, x = xs[v] + (spiral ? Math.round(1.6 * Math.sin((h + ph[v] * 2) / 2.6)) : 0), y = T - 1 - h, node = (h + ph[v]) % 6 === 5;
      add(d, x, y, node ? 'd' : 'l'); add(d, x + 1, y, node ? 'd' : 'm');
      if (node) { const sd = ((h + ph[v] + 1) / 6) % 2 ? 1 : -1, bx = sd > 0 ? x + 2 : x - 1; add(d, bx, y - 1, 'm'); add(d, bx + sd, y - 2, 'l'); add(d, bx + 2 * sd, y - 2, 'm'); }
    }
    return plan;
  }

  function pearls(r, T) {
    const { plan, add } = mk(); crown(add, T, 'l', 'm');
    const V = choose(r, ['Perles', 'Perles', 'Dauphins', 'Bananes']), gap = V === 'Dauphins' ? 3 : 2.6, nS = V === 'Dauphins' ? 7 + int(r() * 2) : 6 + int(r() * 3); plan.variety = V;
    const offs = [-9, 9, -12, 12, -15, 15, -18, 18].slice(0, nS), n = offs.map(() => 0), y0 = offs.map(() => T + 1 + int(r() * 2)), phs = offs.map(() => r() * 6);
    const next = lanes(r, nS, () => int((H - 3 - T - 3) / gap), 3);
    for (let d = 0; d < N; d++) {
      const v = next(), m = n[v]++, x = CX + offs[v] + Math.round(Math.sin(m * 0.5 + phs[v])), y = y0[v] + int(m * gap);
      if (m === 0) for (const q of line(CX + Math.sign(offs[v]) * 6, T - 1, x, y)) add(d, q[0], q[1], 'd');
      if (V === 'Perles') { add(d, x, y, 'l'); add(d, x + 1, y, 'm'); add(d, x, y + 1, 'm'); add(d, x + 1, y + 1, 'd'); }
      if (V === 'Dauphins') { const s = m % 2 ? 1 : -1; add(d, x, y, 'd'); add(d, x + s, y, 'l'); add(d, x + 2 * s, y, 'm'); add(d, x + s, y - 1, 'm'); add(d, x + 2 * s, y + 1, 'd'); }
      if (V === 'Bananes') { const s = m % 2 ? 1 : -1; add(d, x, y, 'd'); add(d, x + s, y, 'm'); add(d, x + 2 * s, y - 1, 'l'); add(d, x + s, y + 1, 'd'); }
    }
    return plan;
  }

  function calathea(r, T) {
    const st = choose(r, [
      { name: 'Médaillon', kind: 'calathea', hw: [1, 2, 3, 3, 3, 3, 2, 2, 1], reach: 2, step: 3 },
      { name: 'Orbifolia', kind: 'orbi', hw: [2, 4, 5, 5, 5, 5, 4, 3, 2], reach: 3, step: 4 },
      { name: 'Lancifolia', kind: 'lance', hw: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1], reach: 2, step: 3 },
    ]);
    const plan = bigleaf(st)(r, T); plan.variety = st.name; return plan;
  }

  function bonsai(r, T) {
    const { plan, add } = mk(); const V = choose(r, ['Chokkan (droit)', 'Moyogi (sinueux)', 'Moyogi (sinueux)', 'Shakan (incliné)', 'Fukinagashi (battu par le vent)']); plan.variety = V;
    const wind = V[0] === 'F', dir = r() < 0.5 ? -1 : 1, Ht = 20 + int(r() * 7);
    const lean = V[0] === 'S' ? 0.45 + r() * 0.2 : wind ? 0.3 + r() * 0.15 : V[0] === 'M' ? (r() - 0.5) * 0.3 : 0, amp = V[0] === 'M' ? 2.5 + r() * 2 : wind ? 1 : 0, freq = 0.22 + r() * 0.12;
    const tx = h => CX - Math.round(dir * lean * Ht * 0.35) + Math.round(dir * (lean * h + amp * Math.sin(h * freq)));
    const trunk = [], limbs = [], pads = [];
    for (let h = 0; h < Ht; h++) { const w = h === 0 ? 2 : h < Ht * 0.35 ? 1 : 0, x = tx(h); for (let dx = -w; dx <= (h < Ht * 0.7 ? Math.max(w, 1) : w); dx++) trunk.push([x + dx, T - 1 - h, dx > 0 ? 'bd' : 'b']); }
    const nB = 3 + int(r() * 3);
    for (let i = 0; i < nB; i++) {
      const h = Math.round(Ht * (0.38 + 0.5 * i / nB)), side = wind ? dir : (i % 2 ? 1 : -1) * dir, len = Math.round((wind ? 9 : 8) - i * (wind ? 0.8 : 1.1) + r() * 2), x0 = tx(h), y0 = T - 1 - h;
      const end = [x0 + side * len, y0 - (wind ? 0 : 1 + int(r() * 2))];
      line(x0 + side, y0, end[0], end[1]).forEach(p => limbs.push([p[0], p[1], 'b']));
      pads.push({ x: end[0] + (wind ? side * 2 : 0), y: end[1] - 1, rx: Math.max(3, (wind ? 6 : 5) - int(i / 2)), ry: 2 });
    }
    pads.push({ x: tx(Ht - 1) + (wind ? dir * 3 : 0), y: T - 1 - Ht, rx: wind ? 5 : 4, ry: 3 });
    const leaves = pads.map(p => {
      const px = [];
      for (let dy = -p.ry; dy <= p.ry; dy++) for (let dx = -p.rx; dx <= p.rx; dx++) {
        const q = (dx * dx) / (p.rx * p.rx + 0.5) + (dy * dy) / (p.ry * p.ry + 0.5);
        if (q <= 1 && !(dy === p.ry && (dx + p.x) % 3 === 0)) px.push([p.x + dx, p.y + dy, dy < 0 ? (dy === -p.ry || (dx + dy) % 3 === 0 ? 'l' : 'm') : dy === p.ry ? 'k' : (dx % 2 ? 'd' : 'm'), q + r() * 0.35]);
      }
      return px.sort((a, b) => a[3] - b[3]);
    });
    const foliage = []; for (let i = 0; leaves.some(l => i < l.length); i++) leaves.forEach(l => { if (i < l.length) foliage.push(l[i]); });
    const put = (list, d0, d1) => list.forEach((p, i) => add(d0 + int(i * (d1 - d0) / list.length), p[0], p[1], p[2]));
    put(trunk, 0, 28); put(limbs, 28, 42); put(foliage, 42, N);
    return plan;
  }

  // Règle : au jour 120, chaque jour garde au moins un pixel visible (KEEP si possible).
  // 1. Un jour recouvert reprend des cases aux jours plus récents qui en ont en trop.
  // 2. S'il ne reste rien à reprendre, il pousse d'un pixel dans la case libre la plus proche.
  const KEEP = 2;
  function settle(plan, T, potHW) {
    const inPot = (x, y) => y > T && y <= T + 10 && Math.abs(x - CX) <= potHW[y - T - 1];
    const scenery = (x, y) => inPot(x, y) || (y === T && Math.abs(x - CX) <= potHW[0] - 1) || (y >= T + 11 && y <= T + 13);
    const inGrid = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const days = plan.map(px => { const m = new Map(); for (const p of px) { if (!inGrid(p[0], p[1]) || inPot(p[0], p[1])) continue; m.set(p[1] * W + p[0], p[2]); } return m; });
    const owner = new Map(), count = new Array(N).fill(0), used = new Set();
    days.forEach((m, d) => { for (const c of m.keys()) { owner.set(c, d); used.add(c); } });
    for (const d of owner.values()) count[d]++;
    for (let d = 0; d < N; d++) {
      while (count[d] < KEEP) {
        const floor = count[d] === 0 ? 1 : KEEP; let best = -1, bestN = floor;
        for (const c of days[d].keys()) {
          const o = owner.get(c); if (o === d || count[o] <= bestN) continue;
          let safe = true; for (let e = d + 1; e < o && safe; e++) if (days[e].has(c) && days[e].size <= 1) safe = false;
          if (safe) { bestN = count[o]; best = c; }
        }
        if (best < 0) break;
        const o = owner.get(best);
        for (let e = d + 1; e < N; e++) days[e].delete(best);
        owner.set(best, d); count[o]--; count[d]++;
      }
      if (count[d] === 0) {
        let found = -1, tone = 'm', bd = 99;
        for (const p of plan[d]) for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
          const x = Math.max(0, Math.min(W - 1, p[0])) + dx, y = Math.max(0, Math.min(H - 1, p[1])) + dy, dist = Math.abs(dx) + Math.abs(dy);
          if (dist >= bd || !inGrid(x, y) || scenery(x, y) || used.has(y * W + x)) continue;
          bd = dist; found = y * W + x; tone = p[2];
        }
        if (found >= 0) { days[d].set(found, tone); owner.set(found, d); used.add(found); count[d] = 1; }
      }
    }
    return days.map(m => [...m].map(([c, tone]) => [c % W, int(c / W), tone]));
  }

  const SPECIES = {
    sansevieria: { name: 'Sansevieria', note: 'Des lames qui montent une à une', build: sansevieria },
    pothos: { name: 'Pothos', note: 'Une liane qui retombe de la tablette', hang: true, build: pothos },
    monstera: { name: 'Monstera', note: 'Les trous apparaissent avec la maturité', build: monstera },
    spider: { name: 'Plante araignée', note: 'Des bébés au bout de longues tiges', build: spider },
    cactus: { name: 'Cactus', note: 'Saguaro, cierges ou raquettes', build: cactus },
    aloe: { name: 'Aloès', note: 'Une rosette qui se resserre vers le centre', build: aloe },
    fern: { name: 'Fougère', note: 'Des frondes en arc, plume par plume', build: fern },
    ficus: { name: 'Caoutchouc', note: 'Une tige droite, une feuille à la fois', build: ficus },
    bamboo: { name: 'Bambou', note: 'Trois cannes qui montent à leur rythme', build: bamboo },
    pearls: { name: 'Collier de perles', note: 'Une perle par jour', hang: true, build: pearls },
    calathea: { name: 'Calathea', note: 'Des feuilles rayées bordées de violet', build: calathea },
    jade: { name: 'Arbre de jade', note: 'Des branches, puis le feuillage', build: jade },
    bonsai: { name: 'Bonsaï', note: 'Un tronc, des branches, des coussins de feuillage', tray: true, build: bonsai },
  };

  function render(key, seed, days, relapses) {
    const sp = SPECIES[key], T = sp.hang ? 8 : 50, r = rng(hash(key) ^ Math.imul(seed | 0, 2654435761));
    r();
    const G = genome(key, seed), pot = POTS[G.pot], shape = sp.tray ? TRAY : POT_SHAPES[G.shape], potHW = shape.hw, grid = new Array(W * H).fill(null);
    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c; };
    for (let x = CX - potHW[0] + 1; x <= CX + potHW[0] - 1; x++) set(x, T, '#5B4636');
    for (let i = 0; i < 10; i++) {
      const y = T + 1 + i, hw = potHW[i];
      if (hw === 0) { for (const x of [CX - 7, CX - 6, CX + 6, CX + 7]) set(x, y, x > CX ? pot[1] : pot[0]); continue; }
      for (let x = CX - hw; x <= CX + hw; x++) {
        let c = x > CX + hw - 3 ? pot[1] : pot[0];
        if (!sp.tray && G.band === 1 && (i === 4 || i === 5)) c = x > CX + hw - 3 ? '#C9C2AC' : '#EEE8D5';
        if (!sp.tray && G.band === 2 && i >= 3 && i <= 8 && (i % 3 === 1) && (x - CX + 12) % 4 === (i % 2 ? 0 : 2)) c = '#EEE8D5';
        set(x, y, c);
      }
    }
    for (let x = 0; x < W; x++) { set(x, T + 11, '#B58900'); set(x, T + 12, '#B58900'); set(x, T + 13, '#93710A'); }
    // La graine choisit le sens de pousse (miroir) et, pour les traits rares, les zones panachées.
    let raw = sp.build(r, T); const variety = raw.variety || '';
    if (G.mirror) raw = raw.map(px => px.map(p => [2 * CX - p[0], p[1], p[2]]));
    if (G.trait.v) raw = raw.map(px => px.map(p => ((p[2] === 'l' || p[2] === 'm' || p[2] === 'c' || p[2] === 'cl' || p[2] === 'e') && hash((p[0] >> 1) + ':' + (p[1] >> 1) + ':' + G.salt) % 100 < G.trait.pct) ? [p[0], p[1], 'v'] : p));
    const plan = settle(raw, T, potHW), rel = new Set(relapses || []), dayAt = new Array(W * H).fill(0);
    const pal = Object.assign({}, PAL, { l: G.foliage.l, m: G.foliage.m, d: G.foliage.d, k: G.foliage.k, c: G.foliage.c, cd: G.foliage.cd, cl: G.foliage.cl, v: G.trait.v });
    const sick = Object.assign({}, SICK, { v: '#C9A227' });
    for (let d = 0; d < Math.min(days, N); d++) { const P = rel.has(d + 1) ? sick : pal; for (const p of plan[d]) { set(p[0], p[1], P[p[2]]); dayAt[p[1] * W + p[0]] = d + 1; } }
    const traits = { variety, pot: sp.tray ? 'plateau ' + POT_NAMES[G.pot] : 'pot ' + POT_SHAPES[G.shape].name + ' ' + POT_NAMES[G.pot] + (G.band ? ' ' + POT_BANDS[G.band] : ''), foliage: G.foliage.name, trait: G.trait.name, rare: G.trait.w <= 5 };
    return { w: W, h: H, grid, dayAt, traits };
  }

  const api = { W, H, MAX_DAYS: N, SPECIES, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PlantLab = api;
})(typeof window !== 'undefined' ? window : globalThis);
