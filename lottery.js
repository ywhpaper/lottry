import { SSQ_HEADER, DLT_HEADER } from './headers.js';
import { analyzeSSQ, analyzeDLT, recommendSSQ, recommendDLT } from './core.js';

const SSQ_URL = (start, end) =>
  `http://datachart.500.com/ssq/history/newinc/history.php?start=${start}&end=${end}`;
const DLT_URL = (start, end) =>
  `http://datachart.500.com/dlt/history/newinc/history.php?start=${start}&end=${end}`;

function diagLog(msg) {
  const el = document.getElementById('diag');
  if (!el) return;
  el.classList.add('show');
  const ts = new Date().toLocaleTimeString();
  el.textContent += `[${ts}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
}
function diagClear() {
  const el = document.getElementById('diag');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}

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
  diagLog('请求网址: ' + url);
  diagLog('页面来源(origin): ' + location.origin + '  协议: ' + location.protocol);
  let resp;
  try {
    resp = await fetch(url);
  } catch (e) {
    diagLog('fetch 抛出异常: ' + e.name + ' - ' + e.message);
    diagLog('→ 多半是 CORS 跨域拦截 或 网络/混合内容(https页面请求http)被拦。');
    diagLog('  浏览器的 fetch 不同于 Python requests:目标站点不返回 CORS 头时,响应会被浏览器拦掉。');
    throw e;
  }
  diagLog('HTTP 状态: ' + resp.status + ' ' + resp.statusText + '  type=' + resp.type);
  if (resp.type === 'opaque') {
    diagLog('→ 响应是 opaque(no-cors 模式),内容不可读,无法解析。');
  }
  const html = await resp.text();
  diagLog('收到响应文本长度: ' + html.length + ' 字符');
  const draws = parseRows(html, kind);
  diagLog('解析出期数: ' + draws.length + ' 条');
  if (draws.length === 0) {
    diagLog('→ 0 条:可能页面结构变了(找不到 tr.t_tr1),或返回的是跳转/拦截页而非数据表。');
    diagLog('  返回内容前 300 字符预览:');
    diagLog(html.slice(0, 300));
  } else {
    diagLog('首条样例: ' + JSON.stringify(draws[0]));
  }
  return draws;
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

function classForCell(group, label, value) {
  const cls = [];
  if (value === '↑克' || value === '↓克') cls.push('ke');
  else if (value === '刑') cls.push('xing');
  else if (value === '↑生' || value === '↓生') cls.push('sheng');
  if (group === '蓝球1区') cls.push('zone1');
  else if (group === '蓝球2区') cls.push('zone2');
  else if (group === '蓝球3区') cls.push('zone3');
  return cls.join(' ');
}

export function renderTable(rows, header, container) {
  let html = '<table class="lottery"><thead><tr>';
  let i = 0;
  while (i < header.length) {
    const g = header[i][0];
    let span = 1;
    while (i + span < header.length && header[i + span][0] === g) span++;
    html += `<th colspan="${span}">${g}</th>`;
    i += span;
  }
  html += '</tr><tr>';
  for (const [, label] of header) html += `<th>${label}</th>`;
  html += '</tr></thead><tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (let c = 0; c < header.length; c++) {
      const [g, label] = header[c];
      const v = row[c];
      const cls = classForCell(g, label, v);
      html += `<td class="${cls}">${v == null ? '' : v}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function fillFor(group) {
  const map = { '蓝球1区':'FFFFE0', '蓝球2区':'ADD8E6', '蓝球3区':'90EE90' };
  return map[group];
}
function fontColorFor(value) {
  if (value === '↑克' || value === '↓克') return 'FF0000';
  if (value === '刑') return '00FF00';
  if (value === '↑生' || value === '↓生') return '0000FF';
  return null;
}

export async function exportExcel(rows, header, filename) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  const thin = { style: 'thin', color: { argb: 'FF000000' } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  const groupRow = ws.addRow(header.map((h) => h[0]));
  const labelRow = ws.addRow(header.map((h) => h[1]));
  let i = 0;
  while (i < header.length) {
    const g = header[i][0]; let span = 1;
    while (i + span < header.length && header[i + span][0] === g) span++;
    if (span > 1) ws.mergeCells(1, i + 1, 1, i + span);
    i += span;
  }
  for (const r of [groupRow, labelRow]) r.eachCell((c) => {
    c.border = border; c.alignment = { horizontal: 'center', vertical: 'center' };
  });

  for (const row of rows) {
    const xr = ws.addRow(row.map((v) => (v == null ? '' : v)));
    xr.eachCell({ includeEmpty: true }, (cell, col) => {
      const [g] = header[col - 1];
      const v = row[col - 1];
      cell.border = border;
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      const fill = fillFor(g);
      if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fill } };
      const fc = fontColorFor(v);
      if (fc) cell.font = { color: { argb: 'FF' + fc } };
    });
  }

  ws.columns.forEach((col, idx) => {
    if (idx === 1) col.width = 8; else if (idx === 2) col.width = 23;
    else if (idx >= 3 && idx < 17) col.width = 6; else col.width = 3.5;
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const state = { kind: 'ssq', rows: [], draws: [] };

function currentHeader() { return state.kind === 'ssq' ? SSQ_HEADER : DLT_HEADER; }
function analyzeFor(kind, draws) {
  const recent = draws.slice(-180);
  return kind === 'ssq' ? analyzeSSQ(recent) : analyzeDLT(recent);
}

async function onGenerate() {
  const btn = document.getElementById('btn-generate');
  btn.disabled = true; btn.textContent = '抓取中...';
  diagClear();
  diagLog('开始生成,板块=' + state.kind);
  try {
    const draws = await refreshDraws(state.kind);
    state.draws = draws;
    state.rows = analyzeFor(state.kind, draws);
    renderTable(state.rows, currentHeader(), document.getElementById('table-container'));
    diagLog('成功:合并后共 ' + draws.length + ' 期,渲染最近 ' + Math.min(draws.length, 180) + ' 期。');
  } catch (e) {
    document.getElementById('table-container').textContent = '抓取失败:' + e.message;
    diagLog('抓取失败,错误: ' + e.name + ' - ' + e.message);
    const cached = loadCache(state.kind);
    diagLog('本地缓存现有 ' + cached.length + ' 期(抓取失败时仍可用缓存数据分析)。');
  } finally {
    btn.disabled = false; btn.textContent = '生成 / 更新';
  }
}

function onDownload() {
  if (!state.rows.length) return alert('请先点击生成');
  const name = state.kind === 'ssq' ? '双色球转化结果.xlsx' : '大乐透转化结果.xlsx';
  exportExcel(state.rows, currentHeader(), name);
}

function onRecommend() {
  if (!state.draws.length) return alert('请先点击生成');
  const recent = state.draws.slice(-100);
  const el = document.getElementById('recommend');
  if (state.kind === 'ssq') {
    const r = recommendSSQ(recent);
    el.textContent = `推荐(双色球):红 ${r.reds.join(' ')} + 蓝 ${r.blue}`;
  } else {
    const r = recommendDLT(recent);
    el.textContent = `推荐(大乐透):前区 ${r.fronts.join(' ')} + 后区 ${r.backs.join(' ')}`;
  }
}

function switchTab(kind) {
  state.kind = kind; state.rows = []; state.draws = [];
  document.getElementById('tab-ssq').classList.toggle('active', kind === 'ssq');
  document.getElementById('tab-dlt').classList.toggle('active', kind === 'dlt');
  document.getElementById('table-container').innerHTML = '';
  document.getElementById('recommend').textContent = '';
  const cached = loadCache(kind);
  if (cached.length) {
    state.draws = cached;
    state.rows = analyzeFor(kind, cached);
    renderTable(state.rows, currentHeader(), document.getElementById('table-container'));
  }
}

function onCopyDiag() {
  const el = document.getElementById('diag');
  const text = el ? el.textContent : '';
  if (!text) return alert('暂无诊断信息,请先点击「生成 / 更新」');
  navigator.clipboard.writeText(text).then(
    () => alert('诊断信息已复制,可粘贴发送'),
    () => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      alert('已选中诊断文本,请手动复制(Ctrl+C)');
    }
  );
}

document.getElementById('btn-generate').addEventListener('click', onGenerate);
document.getElementById('btn-download').addEventListener('click', onDownload);
document.getElementById('btn-recommend').addEventListener('click', onRecommend);
document.getElementById('btn-copy-diag').addEventListener('click', onCopyDiag);
document.getElementById('tab-ssq').addEventListener('click', () => switchTab('ssq'));
document.getElementById('tab-dlt').addEventListener('click', () => switchTab('dlt'));

switchTab('ssq');
