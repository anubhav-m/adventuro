export const ADMIN = Object.freeze({
  id: '6acb6f4b2fce015e85723261',
  email: 'aditya@example.com',
  name: 'Aditya Admin',
  avatarUrl: null,
  phone: '9876543211',
  role: 'admin',
  themePreference: 'system',
  profileComplete: true,
});

export const CUSTOMER = Object.freeze({
  id: '6acb6f4b2fce015e85723265',
  email: 'asha@example.com',
  name: 'Asha Customer',
  avatarUrl: null,
  phone: '9876543210',
  role: 'user',
  themePreference: 'system',
  profileComplete: true,
});

const VERTICALS = Object.freeze(
  [
    ['tidetrail', 'TT', 'TideTrail'],
    ['goldensaga', 'GS', 'GoldenSaga'],
    ['peakpulse', 'PP', 'PeakPulse'],
    ['elitescape', 'ES', 'EliteScape'],
    ['urbanecho', 'UE', 'UrbanEcho'],
    ['grand-india-tour', 'GI', 'Grand India Tour'],
  ].map(([key, code, name], index) =>
    Object.freeze({ id: `vertical-${index + 1}`, key, code, name }),
  ),
);

const [TIDETRAIL, GOLDENSAGA] = VERTICALS;

const booking = ({ bookingNumber, vertical, tourTitle, tierName, travelers, price, status }) => ({
  id: `booking-${bookingNumber}`,
  bookingNumber,
  status,
  statusUpdatedAt: null,
  travelers,
  startDate: '2026-11-11',
  totalAmount: price * travelers,
  createdAt: '2026-10-12T06:30:00.000Z',
  snapshot: {
    tourTitle,
    verticalName: vertical.name,
    verticalCode: vertical.code,
    tierName,
    pricePerPerson: price,
    durationDays: 4,
  },
  contact: { name: 'Asha Customer', phone: '9876543210', email: 'asha@example.com' },
  tour: { id: `tour-${bookingNumber}`, slug: 'a-tour' },
  vertical,
  reporting: { location: 'Dabolim Airport', address: 'Goa', time: '10:30' },
  user: CUSTOMER.id,
});

// GET /admin/dashboard for the three days 10–12 Oct 2026, with every section filled.
export const DASHBOARD = Object.freeze({
  range: { from: '2026-10-10', to: '2026-10-12', days: 3 },
  totals: {
    users: 1234,
    newUsers: 3,
    bookings: 4,
    bookingValue: 97496,
    newsletterSubscribers: 56,
  },
  newUsersPerDay: [
    { date: '2026-10-10', count: 0 },
    { date: '2026-10-11', count: 1 },
    { date: '2026-10-12', count: 2 },
  ],
  bookingsPerDay: [
    { date: '2026-10-10', bookings: 0, value: 0 },
    { date: '2026-10-11', bookings: 1, value: 37498 },
    { date: '2026-10-12', bookings: 3, value: 59998 },
  ],
  bookingsByStatus: { confirmed: 2, cancelled: 1, completed: 1 },
  bookingsByVertical: VERTICALS.map((vertical) => ({
    vertical,
    ...({
      tidetrail: { bookings: 3, value: 59998 },
      goldensaga: { bookings: 1, value: 37498 },
    }[vertical.key] ?? { bookings: 0, value: 0 }),
  })),
  topTours: [
    { tourId: 'tour-goa', title: 'Goa Coastal Escape', bookings: 3, value: 59998 },
    { tourId: 'tour-jaisalmer', title: 'Jaisalmer Dunes Desert Camp', bookings: 1, value: 37498 },
  ],
  topGear: [
    { gearId: 'gear-1', name: 'Trailhead 45L Trek Backpack', slug: 'trailhead-45l', clicks: 12 },
    { gearId: 'gear-2', name: 'DryTide 20L Dry Bag', slug: 'drytide-20l', clicks: 7 },
  ],
  recentBookings: [
    booking({
      bookingNumber: 'ADV-TT-2026-000002',
      vertical: TIDETRAIL,
      tourTitle: 'Goa Coastal Escape',
      tierName: 'Explorer',
      travelers: 2,
      price: 18749,
      status: 'confirmed',
    }),
    booking({
      bookingNumber: 'ADV-GS-2026-000001',
      vertical: GOLDENSAGA,
      tourTitle: 'Jaisalmer Dunes Desert Camp',
      tierName: 'Essential',
      travelers: 4,
      price: 9374,
      status: 'cancelled',
    }),
  ],
});

// The same shape with nothing in it, as the API answers for a range without activity.
export const EMPTY_DASHBOARD = Object.freeze({
  range: DASHBOARD.range,
  totals: { users: 2, newUsers: 0, bookings: 0, bookingValue: 0, newsletterSubscribers: 0 },
  newUsersPerDay: DASHBOARD.newUsersPerDay.map(({ date }) => ({ date, count: 0 })),
  bookingsPerDay: DASHBOARD.bookingsPerDay.map(({ date }) => ({ date, bookings: 0, value: 0 })),
  bookingsByStatus: { confirmed: 0, cancelled: 0, completed: 0 },
  bookingsByVertical: VERTICALS.map((vertical) => ({ vertical, bookings: 0, value: 0 })),
  topTours: [],
  topGear: [],
  recentBookings: [],
});
