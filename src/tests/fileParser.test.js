/*
 * fileParser.test.js
 *
 * Unit tests for src/utils/fileParser.js
 * Tests CSV and XLSX parsing, empty row stripping, and error cases.
 *
 * Run with: node src/tests/fileParser.test.js
 */

const assert = require('assert');
const XLSX = require('xlsx');
const { parseFile } = require('../utils/fileParser');

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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function makeCsvBuffer(rows) {
  const header = 'amount,type,category,transactionDate,description';
  const lines = rows.map(r =>
    `${r.amount},${r.type},${r.category},${r.transactionDate},${r.description ?? ''}`
  );
  return Buffer.from([header, ...lines].join('\n'), 'utf8');
}

function makeXlsxBuffer(rows) {
  const header = ['amount', 'type', 'category', 'transactionDate', 'description'];
  const data = [header, ...rows.map(r => [r.amount, r.type, r.category, r.transactionDate, r.description ?? ''])];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const sampleRows = [
  { amount: 1500, type: 'INCOME', category: 'Salary', transactionDate: '2024-01-15', description: 'Monthly salary' },
  { amount: 200,  type: 'EXPENSE', category: 'Transport', transactionDate: '2024-01-16', description: '' }
];

/* ─── CSV Tests ───────────────────────────────────────────────────────────── */

console.log('\nfileParser — CSV');

test('parses a valid CSV buffer and returns correct row count', () => {
  const buf = makeCsvBuffer(sampleRows);
  const result = parseFile(buf, 'text/csv');
  assert.strictEqual(result.length, 2, `Expected 2 rows, got ${result.length}`);
});

test('CSV row has correct field values', () => {
  const buf = makeCsvBuffer(sampleRows);
  const result = parseFile(buf, 'text/csv');
  assert.strictEqual(result[0].amount, '1500');
  assert.strictEqual(result[0].type, 'INCOME');
  assert.strictEqual(result[0].category, 'Salary');
  assert.strictEqual(result[0].transactionDate, '2024-01-15');
});

test('accepts text/plain MIME type for CSV', () => {
  const buf = makeCsvBuffer(sampleRows);
  const result = parseFile(buf, 'text/plain');
  assert.strictEqual(result.length, 2);
});

test('strips trailing empty rows from CSV', () => {
  const csv = 'amount,type,category,transactionDate,description\n1500,INCOME,Salary,2024-01-15,\n,,,,\n';
  const buf = Buffer.from(csv, 'utf8');
  const result = parseFile(buf, 'text/csv');
  assert.strictEqual(result.length, 1);
});

/* ─── XLSX Tests ──────────────────────────────────────────────────────────── */

console.log('\nfileParser — XLSX');

test('parses a valid XLSX buffer and returns correct row count', () => {
  const buf = makeXlsxBuffer(sampleRows);
  const result = parseFile(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.strictEqual(result.length, 2);
});

test('XLSX row has correct field values', () => {
  const buf = makeXlsxBuffer(sampleRows);
  const result = parseFile(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.strictEqual(String(result[0].amount), '1500');
  assert.strictEqual(result[0].type, 'INCOME');
  assert.strictEqual(result[0].category, 'Salary');
});

/* ─── Error Cases ─────────────────────────────────────────────────────────── */

console.log('\nfileParser — Error cases');

test('throws 400 for unsupported MIME type', () => {
  const buf = Buffer.from('data', 'utf8');
  try {
    parseFile(buf, 'application/pdf');
    assert.fail('Should have thrown');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('Only CSV and XLSX'));
  }
});

/* ─── Summary ─────────────────────────────────────────────────────────────── */

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
