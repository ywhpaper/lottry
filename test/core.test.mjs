import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getElementType } from '../core.js';

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
