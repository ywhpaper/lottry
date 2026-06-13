import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getElementType } from '../core.js';
import { getPropType } from '../core.js';

test('getElementType maps last digit to wuxing', () => {
  assert.equal(getElementType(10), '土'); // 0
  assert.equal(getElementType(5), '土');
  assert.equal(getElementType(1), '水');
  assert.equal(getElementType(16), '水'); // 6
  assert.equal(getElementType(2), '火');
  assert.equal(getElementType(33), '木'); // 3
  assert.equal(getElementType(4), '金');
  assert.equal(getElementType(9), '金');
});

test('getPropType classifies element pairs', () => {
  assert.equal(getPropType('金金'), '刑');
  assert.equal(getPropType('金木'), '↓克');
  assert.equal(getPropType('木金'), '↑克');
  assert.equal(getPropType('金水'), '↓生');
  assert.equal(getPropType('水金'), '↑生');
  assert.equal(getPropType('木水'), '↑生'); // 表内项
});

import { countConsecutive, countRepeatWithPrev, countDuplicates, lastDigit, mod3 } from '../core.js';

test('countConsecutive counts runs of consecutive numbers', () => {
  assert.equal(countConsecutive([1, 2, 3, 7, 8, 20]), 2); // (1,2,3) 和 (7,8)
  assert.equal(countConsecutive([1, 3, 5]), 0);
  assert.equal(countConsecutive([5, 6]), 1);
});

test('countRepeatWithPrev counts overlap with previous draw', () => {
  assert.equal(countRepeatWithPrev([3, 4, 5], [1, 2, 3]), 1); // 3 重复
  assert.equal(countRepeatWithPrev([1, 2], null), 0);         // 第一期无前驱
});

test('countDuplicates counts duplicated values', () => {
  assert.equal(countDuplicates([1, 1, 2, 3, 3, 3]), 3); // 1×1 + 3×2
  assert.equal(countDuplicates([1, 2, 3]), 0);
});

test('lastDigit and mod3', () => {
  assert.equal(lastDigit(23), 3);
  assert.equal(mod3(7), 1);
});

import { SSQ_HEADER, DLT_HEADER } from '../headers.js';

test('header lengths match Python multi_index', () => {
  assert.equal(SSQ_HEADER.length, 97);
  assert.equal(DLT_HEADER.length, 102);
});

import { analyzeSSQ } from '../core.js';

const ssqDraws = [
  { period: '24001', reds: [1, 2, 3, 11, 22, 33], blue: 7 },
  { period: '24002', reds: [3, 8, 15, 16, 20, 30], blue: 12 },
];

test('analyzeSSQ row length equals header length', () => {
  const rows = analyzeSSQ(ssqDraws);
  assert.equal(rows.length, 2);
  for (const r of rows) assert.equal(r.length, SSQ_HEADER.length);
});

test('analyzeSSQ core feature values', () => {
  const r = analyzeSSQ(ssqDraws)[0];
  assert.equal(r[0], '24001');
  assert.equal(r[1], '1.2.3.11.22.33+7');
  assert.equal(r[2], 1 + 2 + 3 + 11 + 22 + 33); // 和值 72
  assert.equal(r[4], null);   // 第一个相克为空
  assert.equal(r[33], 4); // 奇数 1,3,11,33
  assert.equal(r[34], 2); // 偶数 2,22
  assert.equal(r[35], 1); // 分区 one-hot 球号1 在列 35
  assert.equal(r[75], 7); // 蓝球值
});

test('analyzeSSQ 相克 is cross-period per ball position', () => {
  const rows = analyzeSSQ(ssqDraws);
  // entire first period 相克 columns are null
  for (const c of [4, 6, 8, 10, 12, 14]) assert.equal(rows[0][c], null);
  // second period: getPropType(prevElem[i] + curElem[i]) per position
  assert.deepEqual([4, 6, 8, 10, 12, 14].map((c) => rows[1][c]),
    ['↓生', '↑生', '↓克', '刑', '↓生', '↓克']);
  // blue 相克 (col 77): first null, second cross-period
  assert.equal(rows[0][77], null);
  assert.equal(rows[1][77], '刑'); // blue 7→火, 12→火 ⇒ 火火=刑
});
