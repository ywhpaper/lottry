// core.js — pure lottery-analysis logic (Node-testable, no browser side-effects)
import { SSQ_HEADER, DLT_HEADER } from './headers.js';

export function getElementType(num) {
  const d = num % 10;
  if (d === 0 || d === 5) return '土';
  if (d === 1 || d === 6) return '水';
  if (d === 2 || d === 7) return '火';
  if (d === 3 || d === 8) return '木';
  return '金'; // 4,9
}

export function getPropType(pair) {
  if (['金金', '木木', '水水', '火火', '土土'].includes(pair)) return '刑';
  if (['金木', '木土', '土水', '水火', '火金'].includes(pair)) return '↓克';
  if (['木金', '土木', '水土', '火水', '金火'].includes(pair)) return '↑克';
  if (['金水', '水木', '木火', '火土', '土金'].includes(pair)) return '↓生';
  if (['水金', '木水', '火木', '土火', '金土'].includes(pair)) return '↑生';
  return undefined;
}

export const lastDigit = (n) => n % 10;
export const mod3 = (n) => n % 3;

export function countConsecutive(nums) {
  let count = 0, i = 0;
  while (i < nums.length - 1) {
    if (nums[i] + 1 === nums[i + 1]) {
      while (i < nums.length - 1 && nums[i] + 1 === nums[i + 1]) i++;
      count++;
    }
    i++;
  }
  return count;
}

export function countRepeatWithPrev(cur, prev) {
  if (!prev) return 0;
  const set = new Set(prev);
  return cur.reduce((acc, n) => acc + (set.has(n) ? 1 : 0), 0);
}

export function countDuplicates(arr) {
  const seen = new Map();
  let dup = 0;
  for (const v of arr) {
    const c = seen.get(v) || 0;
    if (c >= 1) dup++;
    seen.set(v, c + 1);
  }
  return dup;
}

function crossPeriodProps(prev, cur) {
  if (!prev) return cur.map(() => null);
  return cur.map((n, i) => getPropType(getElementType(prev[i]) + getElementType(n)));
}

export function analyzeSSQ(draws) {
  const rows = [];
  for (let d = 0; d < draws.length; d++) {
    const { period, reds, blue } = draws[d];
    const prevReds = d > 0 ? draws[d - 1].reds : null;
    const row = new Array(SSQ_HEADER.length).fill(null);

    row[0] = period;
    row[1] = reds.join('.') + '+' + blue;
    row[2] = reds.reduce((a, b) => a + b, 0);

    const elems = reds.map(getElementType);
    const props = crossPeriodProps(prevReds, reds);
    for (let i = 0; i < 6; i++) {
      row[3 + i * 2] = elems[i];
      row[4 + i * 2] = props[i];
    }

    for (let i = 0; i < 6; i++) {
      const r = mod3(reds[i]);
      row[15 + i * 3 + r] = r;
    }

    row[33] = reds.filter((n) => n % 2 === 1).length;
    row[34] = reds.filter((n) => n % 2 === 0).length;

    for (const n of reds) {
      if (n >= 1 && n <= 33) row[35 + (n - 1)] = n;
    }

    row[68] = reds.filter((n) => n < 10).length;
    row[69] = reds.filter((n) => n > 9 && n < 20).length;
    row[70] = reds.filter((n) => n > 19 && n < 30).length;
    row[71] = reds.filter((n) => n > 29 && n < 40).length;
    row[72] = countConsecutive(reds);
    row[73] = countRepeatWithPrev(reds, prevReds);
    row[74] = countDuplicates(reds.map(lastDigit));

    row[75] = blue;
    row[76] = getElementType(blue);
    row[77] = d === 0 ? null : getPropType(getElementType(draws[d - 1].blue) + getElementType(blue));

    if (blue >= 1 && blue <= 16) row[78 + (blue - 1)] = blue;

    row[94 + mod3(blue)] = mod3(blue);

    if (row.length !== SSQ_HEADER.length) {
      throw new Error(`SSQ row length ${row.length} != ${SSQ_HEADER.length}`);
    }
    rows.push(row);
  }
  return rows;
}

export function analyzeDLT(draws) {
  const rows = [];
  for (let d = 0; d < draws.length; d++) {
    const { period, fronts, backs } = draws[d];
    const prevFronts = d > 0 ? draws[d - 1].fronts : null;
    const prevBacks = d > 0 ? draws[d - 1].backs : null;
    const row = new Array(DLT_HEADER.length).fill(null);

    row[0] = period;
    row[1] = fronts.join('.') + '+' + backs.join('.');
    row[2] = fronts.reduce((a, b) => a + b, 0);

    const fElems = fronts.map(getElementType);
    const fProps = crossPeriodProps(prevFronts, fronts);
    for (let i = 0; i < 5; i++) {
      row[3 + i * 2] = fElems[i];
      row[4 + i * 2] = fProps[i];
    }
    for (let i = 0; i < 5; i++) {
      const r = mod3(fronts[i]);
      row[13 + i * 3 + r] = r;
    }
    row[28] = fronts.filter((n) => n % 2 === 1).length;
    row[29] = fronts.filter((n) => n % 2 === 0).length;
    for (const n of fronts) if (n >= 1 && n <= 35) row[30 + (n - 1)] = n;
    row[65] = fronts.filter((n) => n < 10).length;
    row[66] = fronts.filter((n) => n > 9 && n < 20).length;
    row[67] = fronts.filter((n) => n > 19 && n < 30).length;
    row[68] = fronts.filter((n) => n > 29 && n < 40).length;
    row[69] = countConsecutive(fronts);
    row[70] = countRepeatWithPrev(fronts, prevFronts);
    row[71] = countDuplicates(fronts.map(lastDigit));

    row[72] = backs[0];
    row[73] = backs[1];
    row[74] = backs.reduce((a, b) => a + b, 0);
    const bElems = backs.map(getElementType);
    row[75] = bElems[0];
    row[76] = bElems[1];
    const bProps = crossPeriodProps(prevBacks, backs);
    row[77] = bProps[0];
    row[78] = bProps[1];
    for (let i = 0; i < 2; i++) {
      const r = mod3(backs[i]);
      row[79 + i * 3 + r] = r;
    }
    row[85] = backs.filter((n) => n % 2 === 1).length;
    row[86] = backs.filter((n) => n % 2 === 0).length;
    for (const n of backs) if (n >= 1 && n <= 12) row[87 + (n - 1)] = n;
    row[99] = countConsecutive(backs);
    row[100] = countRepeatWithPrev(backs, prevBacks);
    row[101] = countDuplicates(backs.map(lastDigit));

    if (row.length !== DLT_HEADER.length) {
      throw new Error(`DLT row length ${row.length} != ${DLT_HEADER.length}`);
    }
    rows.push(row);
  }
  return rows;
}

export function weightedSampleNoReplace(items, weights, k, rng = Math.random) {
  const pool = items.slice();
  const w = weights.slice();
  const out = [];
  for (let n = 0; n < k && pool.length > 0; n++) {
    const total = w.reduce((a, b) => a + b, 0);
    let x = rng() * total;
    let idx = 0;
    while (idx < w.length - 1 && x >= w[idx]) { x -= w[idx]; idx++; }
    out.push(pool[idx]);
    pool.splice(idx, 1);
    w.splice(idx, 1);
  }
  return out;
}

function freqWeights(range, draws, pick) {
  const [min, max] = range;
  const counts = new Array(max - min + 1).fill(0);
  for (const d of draws) for (const n of pick(d)) {
    if (n >= min && n <= max) counts[n - min] += 1;
  }
  const items = [], weights = [];
  for (let n = min; n <= max; n++) {
    items.push(n);
    weights.push(counts[n - min] + 1); // +1 平滑,冷号仍有机会
  }
  return { items, weights };
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function passesValidation(nums, sums, oddRatios) {
  const s = nums.reduce((a, b) => a + b, 0);
  const odd = nums.filter((n) => n % 2 === 1).length / nums.length;
  const sSorted = [...sums].sort((a, b) => a - b);
  const oSorted = [...oddRatios].sort((a, b) => a - b);
  const sLo = quantile(sSorted, 0.1), sHi = quantile(sSorted, 0.9);
  const oLo = quantile(oSorted, 0.1), oHi = quantile(oSorted, 0.9);
  return s >= sLo && s <= sHi && odd >= oLo && odd <= oHi;
}

export function recommendSSQ(draws, rng = Math.random, maxTries = 30) {
  const { items, weights } = freqWeights([1, 33], draws, (d) => d.reds);
  const blue = freqWeights([1, 16], draws, (d) => [d.blue]);
  const sums = draws.map((d) => d.reds.reduce((a, b) => a + b, 0));
  const oddR = draws.map((d) => d.reds.filter((n) => n % 2 === 1).length / 6);
  let reds;
  for (let t = 0; t < maxTries; t++) {
    reds = weightedSampleNoReplace(items, weights, 6, rng).sort((a, b) => a - b);
    if (passesValidation(reds, sums, oddR)) break;
  }
  const blueP = weightedSampleNoReplace(blue.items, blue.weights, 1, rng)[0];
  return { reds, blue: blueP };
}

export function recommendDLT(draws, rng = Math.random, maxTries = 30) {
  const f = freqWeights([1, 35], draws, (d) => d.fronts);
  const b = freqWeights([1, 12], draws, (d) => d.backs);
  const sums = draws.map((d) => d.fronts.reduce((a, x) => a + x, 0));
  const oddR = draws.map((d) => d.fronts.filter((n) => n % 2 === 1).length / 5);
  let fronts;
  for (let t = 0; t < maxTries; t++) {
    fronts = weightedSampleNoReplace(f.items, f.weights, 5, rng).sort((a, b) => a - b);
    if (passesValidation(fronts, sums, oddR)) break;
  }
  const backs = weightedSampleNoReplace(b.items, b.weights, 2, rng).sort((a, b) => a - b);
  return { fronts, backs };
}
