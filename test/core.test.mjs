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
