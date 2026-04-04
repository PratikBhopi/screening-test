/*
 * rowValidator.test.js
 *
 * Unit tests for src/utils/rowValidator.js
 *
 * Run with: node src/tests/rowValidator.test.js
 */

const assert = require('assert');
const { validateRows } = require('../utils/rowValidator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
  }
}

const validRow = {
  amount: '1500',
  type: 'INCOME',
  category: 'Salary',
  transactionDate: '2024-01-15',
  description: 'Monthly salary'
};

/* ─── Valid rows ──────────────────────────────────────────────────────────── */

console.log('\nrowValidator — valid rows');

test('all valid rows produce empty errors array', () => {
  const { valid, errors } = validateRows([validRow, { ...validRow, amount: '200', type: 'EXPENSE' }]);
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(valid.length, 2);
});

test('valid row coerces amount string to number', () => {
  const { valid } = validateRows([validRow]);
  assert.strictEqual(typeof valid[0].amount, 'number');
  assert.strictEqual(valid[0].amount, 1500);
});

test('valid row coerces transactionDate string to Date', () => {
  const { valid } = validateRows([validRow]);
  assert.ok(valid[0].transactionDate instanceof Date);
});

test('description is optional — row without it is valid', () => {
  const row = { amount: '500', type: 'EXPENSE', category: 'Transport', transactionDate: '2024-02-01' };
  const { valid, errors } = validateRows([row]);
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(valid.length, 1);
});

/* ─── Invalid rows ────────────────────────────────────────────────────────── */

console.log('\nrowValidator — invalid rows');

test('missing amount produces error on row 1', () => {
  const row = { ...validRow, amount: '' };
  const { errors } = validateRows([row]);
  assert.ok(errors.length > 0);
  assert.strictEqual(errors[0].row, 1);
  assert.strictEqual(errors[0].field, 'amount');
});

test('negative amount produces error with correct message', () => {
  const row = { ...validRow, amount: '-100' };
  const { errors } = validateRows([row]);
  assert.ok(errors.some(e => e.field === 'amount'));
});

test('invalid type produces error on correct field', () => {
  const row = { ...validRow, type: 'TRANSFER' };
  const { errors } = validateRows([row]);
  assert.ok(errors.some(e => e.field === 'type'));
});

test('missing transactionDate produces error', () => {
  const row = { ...validRow, transactionDate: '' };
  const { errors } = validateRows([row]);
  assert.ok(errors.some(e => e.field === 'transactionDate'));
});

test('row numbers are 1-based and correct for multiple rows', () => {
  const rows = [
    validRow,
    { ...validRow, amount: '-50' },  // row 2 — bad
    validRow,
    { ...validRow, type: 'BAD' }     // row 4 — bad
  ];
  const { errors } = validateRows(rows);
  const rowNums = errors.map(e => e.row);
  assert.ok(rowNums.includes(2), 'Expected error on row 2');
  assert.ok(rowNums.includes(4), 'Expected error on row 4');
  assert.ok(!rowNums.includes(1), 'Row 1 should be valid');
  assert.ok(!rowNums.includes(3), 'Row 3 should be valid');
});

test('valid rows are not included in errors array', () => {
  const rows = [validRow, { ...validRow, amount: '' }];
  const { valid, errors } = validateRows(rows);
  assert.strictEqual(valid.length, 1);
  assert.strictEqual(errors.length, 1);
});

/* ─── Summary ─────────────────────────────────────────────────────────────── */

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
