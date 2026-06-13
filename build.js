// build.js — 把模块化源码打包成一个可双击打开的独立 HTML(无需起服务)。
// 用法: node build.js   ->  生成 彩票分析.html
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// 去掉 ES module 的 import / export,使其能在普通 <script>(非 module)里共享同一作用域
function stripModuleSyntax(src) {
  return src
    .replace(/^\s*import\s+[^\n]*?from\s+['"][^'"]+['"];?\s*$/gm, '') // 整行 import
    .replace(/^\s*export\s+(?=(default|function|const|let|var|class|async))/gm, ''); // 行首 export 关键字
}

const exceljs = read('./vendor/exceljs.min.js');
const headers = stripModuleSyntax(read('./headers.js'));
const core = stripModuleSyntax(read('./core.js'));
const lottery = stripModuleSyntax(read('./lottery.js'));

// 取 index.html 的 <style> 与 <body> 结构,但把外部脚本替换为内联脚本
const indexHtml = read('./index.html');
const styleMatch = indexHtml.match(/<style>[\s\S]*?<\/style>/);
const style = styleMatch ? styleMatch[0] : '';
const bodyMatch = indexHtml.match(/<body>([\s\S]*?)<script/);
// 提取 <body> 里脚本标签之前的可见结构
const bodyInner = bodyMatch
  ? bodyMatch[1].trim()
  : '<h1>彩票分析</h1>';

const out = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>彩票分析</title>
  ${style}
</head>
<body>
${bodyInner}
<script>
${exceljs}
</script>
<script>
// ===== headers.js =====
${headers}
// ===== core.js =====
${core}
// ===== lottery.js =====
${lottery}
</script>
</body>
</html>
`;

writeFileSync(new URL('./彩票分析.html', import.meta.url), out, 'utf8');
console.log('built 彩票分析.html (%d KB)', Math.round(out.length / 1024));
