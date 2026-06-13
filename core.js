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
