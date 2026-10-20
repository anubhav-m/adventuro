import { describe, expect, it } from 'vitest';
import { toCsv } from './csv.js';

const COLUMNS = [
  { header: 'Email', value: (row) => row.email },
  { header: 'Note', value: (row) => row.note },
];

const lines = (csv) => csv.split('\r\n');

describe('toCsv', () => {
  it('writes a header line and one line per row, every cell quoted, lines ended CRLF', () => {
    const csv = toCsv(COLUMNS, [
      { email: 'a@example.com', note: 'first' },
      { email: 'b@example.com', note: 'second' },
    ]);

    expect(lines(csv)).toEqual([
      '"Email","Note"',
      '"a@example.com","first"',
      '"b@example.com","second"',
    ]);
  });

  it('writes only the header for no rows', () => {
    expect(toCsv(COLUMNS, [])).toBe('"Email","Note"');
  });

  it('keeps commas, quotes and line breaks inside their cell', () => {
    const csv = toCsv(COLUMNS, [{ email: 'a@example.com', note: 'says "hi", then\nleaves' }]);

    expect(csv).toBe('"Email","Note"\r\n"a@example.com","says ""hi"", then\nleaves"');
  });

  it.each([
    ['=HYPERLINK("http://evil.example")', `"'=HYPERLINK(""http://evil.example"")"`],
    ['+1+1', `"'+1+1"`],
    ['-2+3', `"'-2+3"`],
    ['@SUM(A1)', `"'@SUM(A1)"`],
    ['\t=1+1', `"'\t=1+1"`],
    ['\r=1+1', `"'\r=1+1"`],
  ])('makes %j plain text with a leading quote', (value, cell) => {
    expect(lines(toCsv(COLUMNS, [{ email: value, note: '' }]))[1]).toBe(`${cell},""`);
  });

  it('leaves a formula character alone when it is not the first', () => {
    expect(lines(toCsv(COLUMNS, [{ email: 'a+b=c@example.com', note: 'x-y' }]))[1]).toBe(
      '"a+b=c@example.com","x-y"',
    );
  });

  it('writes a missing value as an empty cell and a number as its digits', () => {
    expect(lines(toCsv(COLUMNS, [{ email: undefined, note: 42 }]))[1]).toBe('"","42"');
  });

  it('guards the header line too', () => {
    expect(lines(toCsv([{ header: '=cmd', value: () => '' }], []))[0]).toBe(`"'=cmd"`);
  });
});
