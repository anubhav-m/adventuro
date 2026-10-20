// A spreadsheet opens a cell that starts with one of these as a formula (OWASP, CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

// One cell as text: a formula-looking value is made plain text with a leading quote, and every
// cell is quoted so commas, quotes and line breaks stay inside it.
const toCell = (value) => {
  const text = String(value ?? '');
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

// `columns`: [{ header, value: (row) => string }]. Returns RFC 4180 text with a header line.
export const toCsv = (columns, rows) =>
  [
    columns.map(({ header }) => toCell(header)),
    ...rows.map((row) => columns.map(({ value }) => toCell(value(row)))),
  ]
    .map((cells) => cells.join(','))
    .join('\r\n');
