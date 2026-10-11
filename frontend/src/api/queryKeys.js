export const queryKeys = {
  me: ['me'],
  verticals: {
    all: ['verticals'],
    detail: (key) => ['verticals', key],
  },
  tours: {
    all: ['tours'],
    list: (filters) => ['tours', 'list', filters],
    detail: (slug) => ['tours', 'detail', slug],
  },
  gear: {
    all: ['gear'],
    list: (filters) => ['gear', 'list', filters],
  },
  taxonomies: {
    all: ['taxonomies'],
    list: (type) => ['taxonomies', type ?? 'all'],
  },
  bookings: {
    all: ['bookings'],
    mine: (params) => ['bookings', 'mine', ...(params ? [params] : [])],
    detail: (bookingNumber) => ['bookings', 'detail', bookingNumber],
  },
  search: (q) => ['search', q],
};
