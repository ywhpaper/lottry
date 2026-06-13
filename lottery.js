const SSQ_URL = (start, end) =>
  `http://datachart.500.com/ssq/history/newinc/history.php?start=${start}&end=${end}`;
const DLT_URL = (start, end) =>
  `http://datachart.500.com/dlt/history/newinc/history.php?start=${start}&end=${end}`;

function parseRows(html, kind) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const trs = doc.querySelectorAll('tr.t_tr1');
  const draws = [];
  for (const tr of trs) {
    const tds = [...tr.querySelectorAll('td')].map((td) => td.textContent.trim());
    const period = tds[0];
    if (!period || period === '1') continue;
    if (kind === 'ssq') {
      const reds = tds.slice(1, 7).map(Number);
      const blue = Number(tds[7]);
      draws.push({ period, reds, blue });
    } else {
      const fronts = tds.slice(1, 6).map(Number);
      const backs = tds.slice(6, 8).map(Number);
      draws.push({ period, fronts, backs });
    }
  }
  return draws.reverse(); // 500.com is period-descending; normalize ascending
}

async function fetchDraws(kind, start, end) {
  const url = kind === 'ssq' ? SSQ_URL(start, end) : DLT_URL(start, end);
  const resp = await fetch(url);
  const html = await resp.text();
  return parseRows(html, kind);
}

const CACHE_KEY = (kind) => `lottery_${kind}_draws`;

function loadCache(kind) {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY(kind))) || []; }
  catch { return []; }
}
function saveCache(kind, draws) {
  localStorage.setItem(CACHE_KEY(kind), JSON.stringify(draws));
}

function mergeDraws(existing, incoming) {
  const map = new Map(existing.map((d) => [d.period, d]));
  for (const d of incoming) map.set(d.period, d);
  return [...map.values()].sort((a, b) => Number(a.period) - Number(b.period));
}

async function refreshDraws(kind) {
  const cached = loadCache(kind);
  const draws = await fetchDraws(kind, '00001', '27001');
  const merged = mergeDraws(cached, draws);
  saveCache(kind, merged);
  return merged;
}
