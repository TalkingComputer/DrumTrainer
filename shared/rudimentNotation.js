/**
 * rudimentNotation.js
 * Parses a compact rudiment pattern and renders it as SVG drum notation.
 * No dependencies. Works in the browser, in Node and in a Vue/Vite project.
 *
 * Pattern syntax (tokens separated by spaces)
 *   16R         sixteenth note, right hand
 *   8L>         eighth note, left hand, accent
 *   4.R         dotted quarter
 *   8-          eighth rest
 *   16fR>       flam (one grace note) on R, accented
 *   8dL         drag (two grace notes) on L
 *   8RR:        eighth with one tremolo slash (diddle), sticking "RR"
 *   8R::        two slashes, 8R::: three slashes
 *   4Rz         buzz stroke
 *   16R/L       sticking R, second sticking row L (alternate lead)
 *   (3 8R 8L 8R)  triplet group, also (5 …), (6 …)
 *   |           bar line
 */

const DUR_BEATS = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125 };
const BEAM_COUNT = { 1: 0, 2: 0, 4: 0, 8: 1, 16: 2, 32: 3 };

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/**
 * @param {string} src
 * @returns {{ items: Array<object>, errors: string[] }}
 */
export function parsePattern(src) {
  const items = [];
  const errors = [];
  const tokens = String(src || "")
    .replace(/\(\s*(\d+)/g, " ($1 ")
    .replace(/\)/g, " ) ")
    .replace(/\|/g, " | ")
    .split(/\s+/)
    .filter(Boolean);

  let tuplet = null; // { id, n }
  let tupletId = 0;

  for (const tok of tokens) {
    if (tok.startsWith("(")) {
      const n = parseInt(tok.slice(1), 10);
      if (tuplet) errors.push(`Nested tuplet at "${tok}" is not supported`);
      tuplet = { id: ++tupletId, n: n || 3 };
      continue;
    }
    if (tok === ")") {
      if (!tuplet) errors.push('")" without "("');
      tuplet = null;
      continue;
    }
    if (tok === "|") {
      items.push({ type: "bar" });
      continue;
    }
    const m = tok.match(/^(\d+)(\.*)(.*)$/);
    if (!m || !DUR_BEATS[m[1]]) {
      errors.push(`Unknown token "${tok}"`);
      continue;
    }
    const note = {
      type: "note",
      dur: Number(m[1]),
      dots: m[2].length,
      rest: false,
      accent: false,
      grace: null,
      tremolo: 0,
      buzz: false,
      sticking: "",
      alt: "",
      tuplet: tuplet ? { ...tuplet } : null,
    };
    let mods = m[3];
    const slash = mods.indexOf("/");
    if (slash >= 0) {
      note.alt = mods.slice(slash + 1).replace(/[^RL]/g, "");
      mods = mods.slice(0, slash);
    }
    for (const ch of mods) {
      if (ch === "-") note.rest = true;
      else if (ch === ">") note.accent = true;
      else if (ch === "f") note.grace = "flam";
      else if (ch === "d") note.grace = "drag";
      else if (ch === ":") note.tremolo = Math.min(3, note.tremolo + 1);
      else if (ch === "z") note.buzz = true;
      else if (ch === "R" || ch === "L") note.sticking += ch;
      else errors.push(`Unknown modifier "${ch}" in "${tok}"`);
    }
    items.push(note);
  }
  if (tuplet) errors.push("Tuplet not closed with \")\"");
  return { items, errors };
}

/**
 * Turns parsed items back into the pattern syntax.
 * @param {Array<object>} items
 */
export function serializePattern(items) {
  const out = [];
  let open = null;
  for (const it of items) {
    const tid = it.type === "note" && it.tuplet ? it.tuplet.id : null;
    if (open !== null && tid !== open) { out.push(")"); open = null; }
    if (it.type === "bar") { out.push("|"); continue; }
    if (tid !== null && open === null) { out.push(`(${it.tuplet.n}`); open = tid; }
    let s = String(it.dur) + ".".repeat(it.dots || 0);
    if (it.rest) s += "-";
    if (it.grace === "flam") s += "f";
    if (it.grace === "drag") s += "d";
    s += it.sticking || "";
    if (it.accent) s += ">";
    s += ":".repeat(it.tremolo || 0);
    if (it.buzz) s += "z";
    if (it.alt) s += "/" + it.alt;
    out.push(s);
  }
  if (open !== null) out.push(")");
  return out.join(" ").replace(/ \)/g, ")");
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  color: "currentColor",
  background: "none",
  beamGroup: 1,        // beam length in quarter notes (1 = 4/4, 1.5 = 6/8)
  showSticking: true,
  staffLine: false,
  padding: 16,
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
};

function tupletFactor(n) {
  let p = 1;
  while (p * 2 < n) p *= 2;
  return p / n; // 3 -> 2/3, 5 -> 4/5, 6 -> 4/6
}

function noteBeats(n) {
  let b = DUR_BEATS[n.dur];
  let add = b / 2;
  for (let i = 0; i < (n.dots || 0); i++) { b += add; add /= 2; }
  if (n.tuplet) b *= tupletFactor(n.tuplet.n);
  return b;
}

const opposite = (h) => (h === "R" ? "L" : h === "L" ? "R" : "");

/**
 * Renders a pattern (string or parsed items) to an SVG string.
 * @param {string|Array<object>} pattern
 * @param {Partial<typeof DEFAULTS>} [options]
 * @returns {string}
 */
export function renderRudiment(pattern, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const items = typeof pattern === "string" ? parsePattern(pattern).items : pattern;
  const C = o.color;

  const Y0 = 100;            // notehead line
  const STEM_TOP = Y0 - 60;  // top of all stems (stems up)
  const BEAM_H = 5.5;
  const BEAM_GAP = 8.5;
  const STICK_Y = Y0 + 40;

  const els = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const ext = (x1, y1, x2 = x1, y2 = y1) => {
    minX = Math.min(minX, x1, x2); maxX = Math.max(maxX, x1, x2);
    minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2);
  };

  /* ---------- horizontal layout and rhythmic positions ---------- */
  let x = 0;
  let pos = 0;
  const notes = [];
  for (const it of items) {
    if (it.type === "bar") {
      x += 10;
      els.push(`<line x1="${x}" y1="${Y0 - 22}" x2="${x}" y2="${Y0 + 22}" stroke="${C}" stroke-width="2"/>`);
      ext(x, Y0 - 22, x, Y0 + 22);
      x += 18;
      continue;
    }
    const beats = noteBeats(it);
    if (it.grace === "flam") x += 26;
    if (it.grace === "drag") x += 38;
    const stickW = Math.max(it.sticking.length, it.alt.length) * 13;
    const adv = Math.max(30, 18 + beats * 64, stickW + 14) + (it.dots ? 8 : 0);
    notes.push({ ...it, x, pos, beats });
    x += adv;
    pos += beats;
  }

  /* ---------- beam groups ---------- */
  const groups = [];
  let cur = null;
  let lastWindow = null;
  let lastTuplet = null;
  for (let i = 0; i < items.length; i++) { /* placeholder to keep bar info */ }
  const seq = [];
  { // rebuild sequence with bars to break beams
    let ni = 0;
    for (const it of items) seq.push(it.type === "bar" ? { bar: true } : notes[ni++]);
  }
  for (const n of seq) {
    if (n.bar || n.rest || BEAM_COUNT[n.dur] === 0) {
      cur = null;
      if (!n.bar) groups.push([n]);
      continue;
    }
    const tId = n.tuplet ? n.tuplet.id : null;
    let win = Math.floor((n.pos + 1e-6) / o.beamGroup);
    if (tId !== null && tId === lastTuplet && cur) win = lastWindow;
    if (cur && win === lastWindow) cur.push(n);
    else { cur = [n]; groups.push(cur); }
    lastWindow = win;
    lastTuplet = tId;
  }

  /* ---------- drawing helpers ---------- */
  const head = (cx, cy, s = 1, open = false) => {
    const rx = 7.2 * s, ry = 5.3 * s;
    ext(cx - rx, cy - ry, cx + rx, cy + ry);
    const d = ellipsePath(cx, cy, rx, ry, -20);
    return open
      ? `<path d="${d}" fill="none" stroke="${C}" stroke-width="${2 * s}"/>`
      : `<path d="${d}" fill="${C}"/>`;
  };
  const line = (x1, y1, x2, y2, w = 1.8) => { ext(x1, y1, x2, y2); return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C}" stroke-width="${w}" stroke-linecap="butt"/>`; };
  const beam = (x1, x2, y, h = BEAM_H) => { ext(x1, y, x2, y + h); return `<rect x="${r(x1)}" y="${r(y)}" width="${r(Math.max(x2 - x1, 1))}" height="${h}" fill="${C}"/>`; };
  const flag = (sx, sy, i, s = 1) => {
    const y = sy + i * 9 * s;
    ext(sx, y, sx + 12 * s, y + 22 * s);
    return `<path d="M${r(sx)} ${r(y)} c${r(1 * s)} ${r(7 * s)} ${r(11 * s)} ${r(9 * s)} ${r(10 * s)} ${r(20 * s)} c${r(3 * s)} ${r(-9 * s)} ${r(-6 * s)} ${r(-12 * s)} ${r(-10 * s)} ${r(-15 * s)} z" fill="${C}"/>`;
  };
  const text = (tx, ty, str, size, weight = 700, italic = false) => {
    ext(tx - str.length * size * 0.35, ty - size * 0.8, tx + str.length * size * 0.35, ty + size * 0.2);
    return `<text x="${r(tx)}" y="${r(ty)}" font-family="${o.fontFamily}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} text-anchor="middle" fill="${C}">${str}</text>`;
  };

  const stemX = (n) => n.x + 6.4;

  /* ---------- notes ---------- */
  for (const n of notes) {
    if (n.rest) {
      els.push(drawRest(n, Y0, C, ext));
    } else {
      els.push(head(n.x, Y0, 1, n.dur <= 2));
      if (n.dur >= 2) els.push(line(stemX(n), Y0 - 2, stemX(n), STEM_TOP));
    }
    for (let d = 0; d < (n.dots || 0); d++) {
      const dx = n.x + 13 + d * 7;
      els.push(`<circle cx="${dx}" cy="${Y0 - 3}" r="2.2" fill="${C}"/>`);
      ext(dx - 2, Y0 - 5, dx + 2, Y0 - 1);
    }

    // tremolo slashes and buzz
    if (!n.rest && n.tremolo) {
      const beamDepth = BEAM_COUNT[n.dur] * BEAM_GAP;
      const top = (STEM_TOP + beamDepth + Y0) / 2 - (n.tremolo * 7) / 2 - 2;
      const sx = stemX(n);
      for (let t = 0; t < n.tremolo; t++) {
        const y = top + t * 7;
        els.push(`<path d="M${r(sx - 6)} ${r(y + 4)} L${r(sx + 6)} ${r(y)} L${r(sx + 6)} ${r(y + 3)} L${r(sx - 6)} ${r(y + 7)} z" fill="${C}"/>`);
        ext(sx - 6, y, sx + 6, y + 7);
      }
    }
    if (!n.rest && n.buzz) {
      const sx = stemX(n), y = STEM_TOP + BEAM_COUNT[n.dur] * BEAM_GAP + 14;
      els.push(`<path d="M${r(sx - 5)} ${r(y - 4)} H${r(sx + 5)} L${r(sx - 5)} ${r(y + 4)} H${r(sx + 5)}" fill="none" stroke="${C}" stroke-width="2"/>`);
      ext(sx - 5, y - 4, sx + 5, y + 4);
    }

    // grace notes
    if (!n.rest && n.grace) {
      const s = 0.62;
      const gTop = Y0 - 38;
      const gx = n.grace === "flam" ? [n.x - 21] : [n.x - 33, n.x - 22];
      for (const g of gx) {
        els.push(head(g, Y0, s));
        els.push(line(g + 6.4 * s, Y0 - 1, g + 6.4 * s, gTop, 1.3));
      }
      if (n.grace === "flam") {
        const sx = gx[0] + 6.4 * s;
        els.push(flag(sx, gTop, 0, s));
        els.push(line(sx - 6, gTop + 16, sx + 9, gTop + 6, 1.3)); // slash
      } else {
        const x1 = gx[0] + 6.4 * s, x2 = gx[1] + 6.4 * s;
        els.push(beam(x1, x2 + 0.6, gTop, 3.2));
        els.push(beam(x1, x2 + 0.6, gTop + 5.5, 3.2));
      }
      // slur
      const sx1 = gx[0] - 2, sx2 = n.x - 3;
      els.push(`<path d="M${r(sx1)} ${Y0 + 8} Q${r((sx1 + sx2) / 2)} ${Y0 + 17} ${r(sx2)} ${Y0 + 8}" fill="none" stroke="${C}" stroke-width="1.4"/>`);
      ext(sx1, Y0 + 8, sx2, Y0 + 14);
      // grace sticking
      if (o.showSticking && n.sticking) {
        const gs = opposite(n.sticking[0]);
        for (const g of gx) els.push(text(g, STICK_Y - 2, gs, 13, 700));
      }
    }

    // sticking
    if (o.showSticking && n.sticking) els.push(text(n.x, STICK_Y, n.sticking, 20, 700));
    if (o.showSticking && n.alt) els.push(text(n.x, STICK_Y + 26, n.alt, 20, 700));
  }

  /* ---------- beams and flags ---------- */
  for (const g of groups) {
    const beamable = g.filter((n) => !n.rest && BEAM_COUNT[n.dur] > 0);
    if (!beamable.length) continue;
    if (beamable.length === 1) {
      const n = beamable[0];
      for (let i = 0; i < BEAM_COUNT[n.dur]; i++) els.push(flag(stemX(n), STEM_TOP, i));
      continue;
    }
    const first = beamable[0], last = beamable[beamable.length - 1];
    els.push(beam(stemX(first) - 0.9, stemX(last) + 0.9, STEM_TOP));
    for (let level = 2; level <= 3; level++) {
      const y = STEM_TOP + (level - 1) * BEAM_GAP;
      for (let i = 0; i < beamable.length; i++) {
        const n = beamable[i];
        if (BEAM_COUNT[n.dur] < level) continue;
        const next = beamable[i + 1];
        const prev = beamable[i - 1];
        if (next && BEAM_COUNT[next.dur] >= level) {
          els.push(beam(stemX(n) - 0.9, stemX(next) + 0.9, y));
        } else if (!(prev && BEAM_COUNT[prev.dur] >= level)) {
          // stub
          if (prev) els.push(beam(stemX(n) - 11, stemX(n) + 0.9, y));
          else els.push(beam(stemX(n) - 0.9, stemX(n) + 11, y));
        }
      }
    }
  }

  /* ---------- tuplet numbers ---------- */
  const tupletIds = [...new Set(notes.filter((n) => n.tuplet).map((n) => n.tuplet.id))];
  const tupletTop = STEM_TOP - 10;
  for (const id of tupletIds) {
    const tn = notes.filter((n) => n.tuplet && n.tuplet.id === id);
    const cx = (stemX(tn[0]) + stemX(tn[tn.length - 1])) / 2;
    const allBeamed = groups.some((g) => tn.every((n) => g.includes(n))) && tn.every((n) => !n.rest && BEAM_COUNT[n.dur] > 0);
    if (!allBeamed) {
      const x1 = tn[0].x - 4, x2 = stemX(tn[tn.length - 1]) + 4, y = tupletTop - 4;
      els.push(`<path d="M${r(x1)} ${y + 6} V${y} H${r(cx - 9)} M${r(cx + 9)} ${y} H${r(x2)} V${y + 6}" fill="none" stroke="${C}" stroke-width="1.4"/>`);
      ext(x1, y, x2, y + 6);
    }
    els.push(text(cx, tupletTop, String(tn[0].tuplet.n), 17, 700, true));
  }

  /* ---------- accents ---------- */
  for (const n of notes) {
    if (!n.accent) continue;
    const y = (n.tuplet ? tupletTop - 22 : STEM_TOP - 12);
    const cx = n.rest ? n.x : (n.dur >= 2 ? stemX(n) : n.x);
    els.push(`<path d="M${r(cx - 7)} ${r(y - 5)} L${r(cx + 7)} ${r(y)} L${r(cx - 7)} ${r(y + 5)}" fill="none" stroke="${C}" stroke-width="2" stroke-linejoin="miter"/>`);
    ext(cx - 7, y - 5, cx + 7, y + 5);
  }

  /* ---------- staff line ---------- */
  if (o.staffLine && notes.length) {
    els.unshift(`<line x1="${r(minX - 6)}" y1="${Y0}" x2="${r(maxX + 6)}" y2="${Y0}" stroke="${C}" stroke-width="1.2"/>`);
  }

  if (!isFinite(minX)) { minX = 0; maxX = 100; minY = 0; maxY = 100; }
  const p = o.padding;
  const vx = r(minX - p), vy = r(minY - p);
  const w = r(maxX - minX + 2 * p), h = r(maxY - minY + 2 * p);
  const bg = o.background && o.background !== "none"
    ? `<rect x="${vx}" y="${vy}" width="${w}" height="${h}" fill="${o.background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${w} ${h}" width="${w}" height="${h}" role="img">${bg}${els.join("")}</svg>`;
}

function r(v) { return Math.round(v * 100) / 100; }

/** Rotated ellipse as a cubic Bézier path (robust in browsers, Figma and rasterizers). */
function ellipsePath(cx, cy, rx, ry, deg) {
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a), k = 0.5523;
  const P = (t) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return [cx + x * cos - y * sin, cy + x * sin + y * cos]; };
  const D = (t) => { const x = -rx * Math.sin(t), y = ry * Math.cos(t); return [x * cos - y * sin, x * sin + y * cos]; };
  let d = "";
  for (let i = 0; i < 4; i++) {
    const t0 = (i * Math.PI) / 2, t1 = ((i + 1) * Math.PI) / 2;
    const p0 = P(t0), p1 = P(t1), d0 = D(t0), d1 = D(t1);
    if (i === 0) d += `M${r(p0[0])} ${r(p0[1])}`;
    d += `C${r(p0[0] + k * d0[0])} ${r(p0[1] + k * d0[1])} ${r(p1[0] - k * d1[0])} ${r(p1[1] - k * d1[1])} ${r(p1[0])} ${r(p1[1])}`;
  }
  return d + "Z";
}

function drawRest(n, Y0, C, ext) {
  const x = n.x;
  if (n.dur <= 2) {
    const y = n.dur === 1 ? Y0 - 8 : Y0 - 4;
    ext(x - 8, y, x + 8, y + 5);
    return `<rect x="${x - 8}" y="${y}" width="16" height="5" fill="${C}"/>`;
  }
  if (n.dur === 4) {
    ext(x - 6, Y0 - 16, x + 6, Y0 + 16);
    return `<path d="M${x - 3} ${Y0 - 16} L${x + 5} ${Y0 - 6} L${x - 1} ${Y0 + 1} L${x + 5} ${Y0 + 9} C${x - 2} ${Y0 + 6} ${x - 4} ${Y0 + 12} ${x} ${Y0 + 16}" fill="none" stroke="${C}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const count = BEAM_COUNT[n.dur];
  let d = "";
  for (let i = 0; i < count; i++) {
    const cy = Y0 - 8 + i * 8;
    d += `<circle cx="${x - 3 - i * 1.5}" cy="${cy}" r="3" fill="${C}"/>`;
    d += `<path d="M${x - 3 - i * 1.5} ${cy + 1} Q${x + 1} ${cy + 2} ${x + 5 - i * 1.5} ${cy - 3}" fill="none" stroke="${C}" stroke-width="1.8"/>`;
  }
  d += `<line x1="${x + 5}" y1="${Y0 - 11}" x2="${x - 1 - count * 2}" y2="${Y0 + 12 + (count - 1) * 4}" stroke="${C}" stroke-width="1.8"/>`;
  ext(x - 8 - count * 2, Y0 - 12, x + 6, Y0 + 14 + count * 4);
  return d;
}

/* ------------------------------------------------------------------ */
/* Presets (PAS rudiments, one pattern each)                           */
/* ------------------------------------------------------------------ */

export const PRESETS = [
  { id: "single-stroke-roll", name: "Single Stroke Roll", pattern: "16R 16L 16R 16L 16R 16L 16R 16L" },
  { id: "single-stroke-four", name: "Single Stroke Four", pattern: "(3 16R/L 16L/R 16R/L) 8L/R (3 16R/L 16L/R 16R/L) 8L/R" },
  { id: "single-stroke-seven", name: "Single Stroke Seven", pattern: "(6 16R 16L 16R 16L 16R 16L) 4R>" },
  { id: "double-stroke-roll", name: "Double Stroke Open Roll", pattern: "16R 16R 16L 16L 16R 16R 16L 16L" },
  { id: "five-stroke-roll", name: "Five Stroke Roll", pattern: "8RR: 8LL: 4R>" },
  { id: "single-paradiddle", name: "Single Paradiddle", pattern: "16R> 16L 16R 16R 16L> 16R 16L 16L" },
  { id: "double-paradiddle", name: "Double Paradiddle", pattern: "16R> 16L 16R 16L 16R 16R 16L> 16R 16L 16R 16L 16L", beamGroup: 1.5 },
  { id: "paradiddle-diddle", name: "Paradiddle-Diddle", pattern: "16R> 16L 16R 16R 16L 16L 16L> 16R 16L 16L 16R 16R", beamGroup: 1.5 },
  { id: "flam", name: "Flam", pattern: "4fR 4fL" },
  { id: "flam-accent", name: "Flam Accent", pattern: "(3 8fR> 8L 8R) (3 8fL> 8R 8L)" },
  { id: "flam-tap", name: "Flam Tap", pattern: "16fR> 16R 16fL> 16L 16fR> 16R 16fL> 16L" },
  { id: "drag", name: "Drag", pattern: "4dR 4dL" },
  { id: "single-drag-tap", name: "Single Drag Tap", pattern: "8dR 8L> 8dL 8R>" },
  { id: "multiple-bounce-roll", name: "Multiple Bounce Roll", pattern: "8Rz 8Lz 8Rz 8Lz" },
];
