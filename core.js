// core.js — pure lottery-analysis logic (Node-testable, no browser side-effects)

export function getElementType(num) {
  const d = num % 10;
  if (d === 0 || d === 5) return '土';
  if (d === 1 || d === 6) return '水';
  if (d === 2 || d === 7) return '火';
  if (d === 3 || d === 8) return '木';
  return '金'; // 4,9
}
