// core.js — pure lottery-analysis logic (Node-testable, no browser side-effects)

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
