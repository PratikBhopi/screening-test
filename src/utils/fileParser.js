const Papa = require('papaparse');
const XLSX = require('xlsx');
const AppError = require('../errors/AppError');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIMES = ['text/csv', 'text/plain'];

// Takes a file buffer and turns it into an array of row objects using the header row as keys.
// I support CSV and XLSX — anything else gets rejected with a 400.
function parseFile(buffer, mimetype) {
  try {
    if (CSV_MIMES.includes(mimetype)) return parseCsv(buffer);
    if (mimetype === XLSX_MIME) return parseXlsx(buffer);
    throw new AppError('Only CSV and XLSX files are accepted', 400);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
  }
}

// I use papaparse here because it handles BOM, quoted fields, and messy line endings cleanly.
// Only fail on fatal structural errors — extra columns and similar warnings are fine.
function parseCsv(buffer) {
  const text = buffer.toString('utf8');

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
    transform: (value) => (typeof value === 'string' ? value.trim() : value)
  });

  if (result.errors?.length > 0) {
    const fatal = result.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
    if (fatal.length > 0) {
      throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
    }
  }

  return stripEmptyRows(result.data);
}

// SheetJS reads the first sheet only. cellDates: true so dates come out as Date objects, not serial numbers.
function parseXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
  }

  const sheet = workbook.Sheets[firstSheetName];

  // defval: '' so missing cells give empty strings instead of undefined — keeps row shape consistent for the validator
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return stripEmptyRows(rows);
}

// Excel exports often have trailing empty rows — I strip them so the validator doesn't choke on blanks.
function stripEmptyRows(rows) {
  return rows.filter(row =>
    Object.values(row).some(v => v !== '' && v !== undefined && v !== null)
  );
}

module.exports = { parseFile };
