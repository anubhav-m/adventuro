import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { Tour } from '../src/models/Tour.js';
import { createTicketDocument } from '../src/services/ticket.service.js';
import { authAgent } from './helpers/authAgent.js';
import { createBooking, createUser } from './helpers/factories.js';

const ticketPath = (bookingNumber) => `/api/v1/bookings/${bookingNumber}/ticket`;

const download = (user, bookingNumber) =>
  authAgent(user).get(ticketPath(bookingNumber)).responseType('blob');

const countPages = (pdf) => pdf.toString('latin1').match(/\/Type \/Page\b/g).length;

const renderTicket = async (booking) => {
  const chunks = [];
  for await (const chunk of createTicketDocument(booking)) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const SAMPLE = Object.freeze({
  bookingNumber: 'ADV-TT-2026-000123',
  status: 'confirmed',
  snapshot: {
    tourTitle: 'Goa Coastal Escape',
    verticalName: 'TideTrail',
    verticalCode: 'TT',
    tierName: 'Explorer',
    pricePerPerson: 18749,
    durationDays: 4,
  },
  travelers: 2,
  startDate: '2026-12-01',
  totalAmount: 37498,
  contact: { name: 'Asha Rao', phone: '9876543210', email: 'asha.rao@example.com' },
  reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
  createdAt: new Date('2026-10-11T09:15:00.000Z'),
});

describe('GET /api/v1/bookings/:bookingNumber/ticket', () => {
  it('signed out → 401 JSON envelope', async () => {
    const booking = await createBooking();
    const res = await request(app).get(ticketPath(booking.bookingNumber));
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('streams a single-page PDF attachment to the owner', async () => {
    const owner = await createUser();
    const booking = await createBooking({ user: owner });

    const res = await download(owner, booking.bookingNumber);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(
      `attachment; filename=Adventuro-${booking.bookingNumber}.pdf`,
    );
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(res.body.subarray(-6).toString()).toContain('%%EOF');
    expect(countPages(res.body)).toBe(1);
  });

  it('lets an admin download any ticket', async () => {
    const booking = await createBooking();
    const admin = await createUser({ role: 'admin' });

    const res = await download(admin, booking.bookingNumber);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it("another user's ticket → 404 JSON envelope, not a PDF", async () => {
    const booking = await createBooking();
    const intruder = await createUser();

    const res = await authAgent(intruder).get(ticketPath(booking.bookingNumber));

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toBeUndefined();
    expect(res.body).toEqual({ success: false, message: 'Booking not found', code: 'NOT_FOUND' });
  });

  it('unknown booking → 404 NOT_FOUND', async () => {
    const res = await authAgent(await createUser()).get(ticketPath('ADV-TT-2026-000404'));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('malformed booking number → 400 VALIDATION_ERROR', async () => {
    const res = await authAgent(await createUser()).get(ticketPath('nope'));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it.each(['cancelled', 'completed'])(
    'still issues the ticket for a %s booking',
    async (status) => {
      const owner = await createUser();
      const booking = await createBooking({ user: owner, status });
      const res = await download(owner, booking.bookingNumber);
      expect(res.status).toBe(200);
      expect(countPages(res.body)).toBe(1);
    },
  );

  it('still issues the ticket if the tour document is gone', async () => {
    const owner = await createUser();
    const booking = await createBooking({ user: owner });
    await Tour.deleteOne({ _id: booking.tour });

    const res = await download(owner, booking.bookingNumber);
    expect(res.status).toBe(200);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });
});

describe('createTicketDocument', () => {
  it('embeds a font instead of relying on the standard PDF fonts', async () => {
    const pdf = (await renderTicket(SAMPLE)).toString('latin1');
    expect(pdf).toContain('NotoSans');
    expect(pdf).toContain('/FontFile2');
    expect(pdf).toContain('Adventuro ticket ADV-TT-2026-000123');
  });

  it('keeps the ticket on one page with every field at its maximum length', async () => {
    const pdf = await renderTicket({
      ...SAMPLE,
      bookingNumber: 'ADV-GI-2026-1234567',
      snapshot: {
        ...SAMPLE.snapshot,
        tourTitle: 'Grand India Heritage Circuit '.repeat(11).slice(0, 300),
        tierName: 'VIP Palace '.repeat(11).slice(0, 120),
        pricePerPerson: 9999999,
        durationDays: 365,
      },
      travelers: 20,
      totalAmount: 199999980,
      contact: {
        name: 'Venkataraghavan '.repeat(8).slice(0, 120),
        phone: '9876543210',
        email: `${'a'.repeat(242)}@example.com`,
      },
      reporting: {
        location: 'Chhatrapati Shivaji Terminus '.repeat(11).slice(0, 300),
        address: 'Platform 18, DN Road, Fort '.repeat(12).slice(0, 300),
        time: '23:05',
      },
    });
    expect(countPages(pdf)).toBe(1);
  });

  it.each([
    ['no reporting details', { reporting: null }],
    ['an empty address', { reporting: { ...SAMPLE.reporting, address: '' } }],
    ['a single traveler', { travelers: 1, totalAmount: 18749 }],
  ])('renders with %s', async (_label, overrides) => {
    const pdf = await renderTicket({ ...SAMPLE, ...overrides });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(countPages(pdf)).toBe(1);
  });
});
