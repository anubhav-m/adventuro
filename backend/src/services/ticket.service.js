import { readFileSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import {
  formatCalendarDate,
  formatClockTime,
  formatIstDateTime,
  formatRupees,
  pluralize,
} from '../utils/format.js';

// The standard PDF fonts have no rupee sign, so Noto Sans (SIL OFL, see assets/fonts/OFL.txt)
// is embedded. PDFKit subsets it, which keeps a ticket at a few tens of kilobytes.
const loadFont = (file) => readFileSync(new URL(`../assets/fonts/${file}`, import.meta.url));
const FONTS = Object.freeze({
  regular: loadFont('NotoSans-Regular.ttf'),
  bold: loadFont('NotoSans-Bold.ttf'),
});

const PAGE = Object.freeze({ size: 'A4', margin: 48 });
const COLORS = Object.freeze({
  ink: '#111827',
  muted: '#6b7280',
  line: '#d1d5db',
  panel: '#f3f4f6',
});
const SIZES = Object.freeze({ label: 8, value: 12, brand: 22, bookingNumber: 26 });
const COLUMN_GAP = 24;
const ROW_GAP = 14;
const SECTION_GAP = 22;
const LABEL_HEIGHT = 13;
const EMPTY_VALUE = '—';

const contentWidth = (doc) => doc.page.width - PAGE.margin * 2;

const drawRule = (doc, y) => {
  doc
    .moveTo(PAGE.margin, y)
    .lineTo(doc.page.width - PAGE.margin, y)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();
};

const drawLabel = (doc, label, x, y, width) => {
  doc
    .font('regular')
    .fontSize(SIZES.label)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.8, lineBreak: false });
};

// Draws a value clipped to `maxLines` (with an ellipsis) and returns the y below it. Bounding
// every free-text field is what keeps the ticket on a single page.
const drawValue = (doc, value, x, y, { width, maxLines = 1, size = SIZES.value }) => {
  doc.font('bold').fontSize(size).fillColor(COLORS.ink);
  const height = doc.currentLineHeight(true) * maxLines;
  doc.text(value || EMPTY_VALUE, x, y, { width, height, ellipsis: true });
  return doc.y;
};

// Lays fields out in equal columns and returns the y below the tallest one.
const drawRow = (doc, y, fields) => {
  const width = (contentWidth(doc) - COLUMN_GAP * (fields.length - 1)) / fields.length;
  const bottoms = fields.map(({ label, value, maxLines }, index) => {
    const x = PAGE.margin + index * (width + COLUMN_GAP);
    drawLabel(doc, label, x, y, width);
    return drawValue(doc, value, x, y + LABEL_HEIGHT, { width, maxLines });
  });
  return Math.max(...bottoms);
};

const drawSection = (doc, y, title, rows) => {
  drawRule(doc, y);
  doc
    .font('bold')
    .fontSize(SIZES.label + 1)
    .fillColor(COLORS.ink)
    .text(title.toUpperCase(), PAGE.margin, y + 12, { characterSpacing: 1.2, lineBreak: false });
  return rows.reduce((rowY, fields) => drawRow(doc, rowY, fields) + ROW_GAP, y + 36) - ROW_GAP;
};

const drawHeader = (doc, booking) => {
  const width = contentWidth(doc);
  doc
    .font('bold')
    .fontSize(SIZES.brand)
    .fillColor(COLORS.ink)
    .text('ADVENTURO', PAGE.margin, PAGE.margin, { characterSpacing: 2, lineBreak: false });
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text('From Coast to Camp • Peak to Palace', PAGE.margin, PAGE.margin + 30, {
      lineBreak: false,
    });
  doc
    .font('bold')
    .fontSize(SIZES.label + 1)
    .fillColor(COLORS.muted)
    .text('BOOKING TICKET', PAGE.margin, PAGE.margin + 6, {
      width,
      align: 'right',
      characterSpacing: 1.2,
    });
  doc
    .font('regular')
    .fontSize(9)
    .text(`Issued on ${formatIstDateTime(booking.createdAt)} IST`, PAGE.margin, doc.y + 6, {
      width,
      align: 'right',
    });
  return PAGE.margin + 58;
};

const drawStatus = (doc, status, y) => {
  const label = status.toUpperCase();
  doc.font('bold').fontSize(10);
  const width = doc.widthOfString(label, { characterSpacing: 1 }) + 24;
  const x = doc.page.width - PAGE.margin - width;
  doc.roundedRect(x, y, width, 24, 12).lineWidth(1).strokeColor(COLORS.ink).stroke();
  doc.fillColor(COLORS.ink).text(label, x + 12, y + 5, { characterSpacing: 1, lineBreak: false });
};

const drawBookingNumber = (doc, booking, y) => {
  drawRule(doc, y);
  drawLabel(doc, 'Booking number', PAGE.margin, y + 18, contentWidth(doc));
  drawStatus(doc, booking.status, y + 30);
  return drawValue(doc, booking.bookingNumber, PAGE.margin, y + 30, {
    width: contentWidth(doc) - 140,
    size: SIZES.bookingNumber,
  });
};

const drawTotal = (doc, booking, y) => {
  const { snapshot, travelers, totalAmount } = booking;
  const width = contentWidth(doc);
  const height = 64;
  const inner = width - 40;
  const breakdown = `${formatRupees(snapshot.pricePerPerson)} × ${pluralize(travelers, 'traveler')}`;

  doc.roundedRect(PAGE.margin, y, width, height, 8).fillColor(COLORS.panel).fill();
  drawLabel(doc, 'Total', PAGE.margin + 20, y + 16, inner);
  doc
    .font('regular')
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(breakdown, PAGE.margin + 20, y + 32, { lineBreak: false });
  doc
    .font('bold')
    .fontSize(22)
    .fillColor(COLORS.ink)
    .text(formatRupees(totalAmount), PAGE.margin + 20, y + 16, { width: inner, align: 'right' });
};

// Expects a booking in the API response shape (see booking.service) and returns a finished
// PDFKit document, which is a readable stream ready to be piped.
export const createTicketDocument = (booking) => {
  const { bookingNumber, snapshot, contact, travelers, startDate } = booking;
  const { time, location, address } = booking.reporting ?? {};

  const doc = new PDFDocument({
    ...PAGE,
    info: { Title: `Adventuro ticket ${bookingNumber}`, Author: 'Adventuro' },
  });
  doc.registerFont('regular', FONTS.regular);
  doc.registerFont('bold', FONTS.bold);

  let y = drawHeader(doc, booking);
  y = drawBookingNumber(doc, booking, y) + SECTION_GAP;

  y = drawSection(doc, y, 'Trip', [
    [{ label: 'Tour', value: snapshot.tourTitle, maxLines: 2 }],
    [
      { label: 'Vertical', value: snapshot.verticalName },
      { label: 'Package tier', value: snapshot.tierName, maxLines: 2 },
    ],
    [
      { label: 'Start date', value: formatCalendarDate(startDate) },
      { label: 'Duration', value: pluralize(snapshot.durationDays, 'day') },
      { label: 'Travelers', value: String(travelers) },
    ],
  ]);

  y = drawSection(doc, y + SECTION_GAP, 'Reporting', [
    [
      { label: 'Reporting time', value: time && `${formatClockTime(time)} IST` },
      { label: 'Reporting location', value: location, maxLines: 2 },
    ],
    [{ label: 'Address', value: address, maxLines: 2 }],
  ]);

  y = drawSection(doc, y + SECTION_GAP, 'Traveler contact', [
    [
      { label: 'Name', value: contact.name, maxLines: 2 },
      { label: 'Phone', value: `+91 ${contact.phone}` },
    ],
    [{ label: 'Email', value: contact.email }],
  ]);

  drawTotal(doc, booking, y + SECTION_GAP);

  doc.end();
  return doc;
};
