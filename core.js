// core.js — pure lottery-analysis logic (Node-testable, no browser side-effects)
import { SSQ_HEADER } from './headers.js';

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

function wuxingSeq(nums) {
  return nums.map(getElementType);
}
function propSeq(elems) {
  const withSentinel = ['木', ...elems];
  const out = [];
  for (let i = 1; i < withSentinel.length; i++) {
    out.push(getPropType(withSentinel[i - 1] + withSentinel[i]));
  }
  out[0] = null;
  return out;
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

    const elems = wuxingSeq(reds);
    const props = propSeq(elems);
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
