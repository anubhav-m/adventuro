export const queryKeys = {
  me: ['me'],
  dashboard: (range) => ['dashboard', range],
  verticals: {
    all: ['verticals'],
    detail: (id) => ['verticals', 'detail', id],
  },
  tours: {
    all: ['tours'],
    list: (filters) => ['tours', 'list', filters],
    detail: (id) => ['tours', 'detail', id],
  },
  gear: {
    all: ['gear'],
    list: (filters) => ['gear', 'list', filters],
    detail: (id) => ['gear', 'detail', id],
  },
  taxonomies: {
    all: ['taxonomies'],
    list: (type) => ['taxonomies', type ?? 'all'],
  },
  bookings: {
    all: ['bookings'],
    list: (filters) => ['bookings', 'list', filters],
    detail: (bookingNumber) => ['bookings', 'detail', bookingNumber],
  },
  users: {
    all: ['users'],
    list: (filters) => ['users', 'list', filters],
    detail: (id) => ['users', 'detail', id],
  },
  newsletter: {
    all: ['newsletter'],
    list: (params) => ['newsletter', 'list', params],
  },
};
