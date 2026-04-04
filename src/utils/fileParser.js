/*
 * fileParser.js
 *
 * Converts a raw file buffer (CSV or XLSX) into a plain array of row objects.
 * Keys are taken from the header row of the file — column order does not matter.
 *
 * Supported MIME types:
 *   text/csv
 *   text/plain          (some clients send .csv files with this type)
 *   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet  (.xlsx)
 *
 * Empty rows (every field blank or undefined) are stripped before returning.
 * This handles trailing newlines in CSV exports and empty rows in Excel files.
 *
 * Throws AppError 400 if:
 *   - MIME type is not supported
 *   - File cannot be parsed (corrupt, wrong format, missing header row)
 */

const Papa = require('papaparse');
const XLSX = require('xlsx');
const AppError = require('../errors/AppError');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIMES = ['text/csv', 'text/plain'];

/**
 * Parses a file buffer into an array of row objects.
 *
 * @param {Buffer} buffer   - Raw file buffer from multer memoryStorage
 * @param {string} mimetype - MIME type reported by the client
 * @returns {Object[]}      - Array of row objects keyed by column header
 * @throws {AppError}       - 400 if unsupported type or parse failure
 */
function parseFile(buffer, mimetype) {
  try {
    if (CSV_MIMES.includes(mimetype)) {
      return parseCsv(buffer);
    }

    if (mimetype === XLSX_MIME) {
      return parseXlsx(buffer);
    }

    throw new AppError('Only CSV and XLSX files are accepted', 400);
  } catch (err) {
    // Re-throw AppErrors as-is; wrap unexpected parse errors
    if (err instanceof AppError) throw err;
    throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
  }
}

/**
 * Parses a CSV buffer using papaparse.
 * papaparse handles BOM characters, quoted fields, and inconsistent line endings.
 *
 * @param {Buffer} buffer
 * @returns {Object[]}
 */
function parseCsv(buffer) {
  const text = buffer.toString('utf8');

  const result = Papa.parse(text, {
    header: true,        // use first row as keys
    skipEmptyLines: true, // drop rows where all fields are empty
    trimHeaders: true,
    transform: (value) => (typeof value === 'string' ? value.trim() : value)
  });

  if (result.errors && result.errors.length > 0) {
    // papaparse reports non-fatal errors (e.g. extra columns) — only fail on fatal ones
    const fatal = result.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
    if (fatal.length > 0) {
      throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
    }
  }

  return stripEmptyRows(result.data);
}

/**
 * Parses an XLSX buffer using SheetJS.
 * Reads the first sheet and converts it to an array of row objects.
 *
 * @param {Buffer} buffer
 * @returns {Object[]}
 */
function parseXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new AppError('Could not parse file. Ensure it matches the required column structure', 400);
  }

  const sheet = workbook.Sheets[firstSheetName];

  /*
   * defval: '' ensures missing cells produce empty strings rather than
   * undefined, which keeps the row object shape consistent for the validator.
   */
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return stripEmptyRows(rows);
}

/**
 * Removes rows where every value is an empty string or undefined.
 * Handles trailing empty rows common in Excel exports.
 *
 * @param {Object[]} rows
 * @returns {Object[]}
 */
function stripEmptyRows(rows) {
  return rows.filter(row =>
    Object.values(row).some(v => v !== '' && v !== undefined && v !== null)
  );
}

module.exports = { parseFile };
