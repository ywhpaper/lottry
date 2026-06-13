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
