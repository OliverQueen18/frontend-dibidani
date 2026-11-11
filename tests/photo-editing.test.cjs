const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/app/shared/photo-editing.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const context = {exports: {}};
vm.runInNewContext(compiled, context);
const { connectedBackground } = context.exports;

function pixels(rows) {
  return new Uint8ClampedArray(rows.flat().flatMap(v => [v, v, v, 255]));
}

test('removes connected background but protects a matching color enclosed in the product', () => {
  const data = pixels([
    [255,255,255,255,255],
    [255,0,0,0,255],
    [255,0,255,0,255],
    [255,0,0,0,255],
    [255,255,255,255,255],
  ]);
  const mask = connectedBackground(data, 5, 5, [0,4,20,24], 5);
  assert.equal(mask.filter(Boolean).length, 16);
  assert.equal(mask[12], 0);
  assert.equal(data[3], 255, 'selection must not alter source pixels');
});

test('does not connect the end of one row with the start of the next', () => {
  const mask = connectedBackground(pixels([[0,255,255],[255,255,0]]), 3, 2, [0], 5);
  assert.equal(mask[0], 255);
  assert.equal(mask[5], 0);
});

test('tolerance is relative to the clicked color, without progressive color leakage', () => {
  const data = pixels([[255,240,220,180]]);
  assert.deepEqual(Array.from(connectedBackground(data, 4, 1, [0], 20)), [255,255,0,0]);
  assert.deepEqual(Array.from(connectedBackground(data, 4, 1, [0], 40)), [255,255,255,0]);
});

test('automatic corner seeds with a different color do not erase the product', () => {
  const data = pixels([[255,255,0],[255,255,0]]);
  assert.deepEqual(Array.from(connectedBackground(data, 3, 2, [0,2,3,5], 5)), [255,255,0,255,255,0]);
});

test('handles transparent pixels and single-pixel images', () => {
  const data = pixels([[255,0,255]]); data[7] = 0;
  assert.deepEqual(Array.from(connectedBackground(data, 3, 1, [0], 5)), [255,255,255]);
  assert.deepEqual(Array.from(connectedBackground(pixels([[10]]), 1, 1, [0], 5)), [255]);
  assert.equal(connectedBackground(new Uint8ClampedArray(), 0, 0, [], 5).length, 0);
});
