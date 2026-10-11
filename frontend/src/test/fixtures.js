import { http } from 'msw';
import { api, server, success } from './server.js';

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

export const INCOMPLETE_CUSTOMER = Object.freeze({
  id: '6acb6f4b2fce015e85723266',
  email: 'ira@example.com',
  name: 'Ira Incomplete',
  avatarUrl: null,
  role: 'user',
  themePreference: 'system',
  profileComplete: false,
});

// In the API's own order, which is not the terrain's.
export const VERTICALS = Object.freeze(
  [
    ['tidetrail', 'TT', 'TideTrail', 'Ocean Blue & Coastal Thrills'],
    ['goldensaga', 'GS', 'GoldenSaga', 'Deserts, Forts & Golden Dunes'],
    ['peakpulse', 'PP', 'PeakPulse', 'Snow Peaks, Passes & Alpine Treks'],
    ['elitescape', 'ES', 'EliteScape', 'Ultra Luxury, Palaces & Private Sanctuaries'],
    ['urbanecho', 'UE', 'UrbanEcho', 'Metropolis Lights, Street Culture & Heritage Trails'],
    ['grand-india-tour', 'GI', 'Grand India Tour', 'One Journey. Countless Stories.'],
  ].map(([key, code, name, subtitle], index) => ({
    id: `vertical-${index + 1}`,
    key,
    code,
    name,
    subtitle,
    description: `${name} description.`,
    heroImage: null,
    order: index + 1,
  })),
);

export const GRAND_INDIA = Object.freeze({
  vertical: {
    ...VERTICALS.at(-1),
    heroImage: { url: 'https://images.example.com/grand.jpg', path: 'verticals/grand.jpg' },
  },
  tours: [
    {
      id: 'tour-1',
      slug: 'grand-india-highlights',
      title: 'Grand India Highlights',
      topActivities: ['Taj Mahal at sunrise', 'Hot-air balloon', 'Amber Fort'],
    },
    {
      id: 'tour-2',
      slug: 'grand-india-signature-circuit',
      title: 'Grand India Signature Circuit',
      topActivities: ['Houseboat night'],
    },
  ],
});

export const CATEGORIES = Object.freeze(
  ['Backpacks', 'Water Gear', 'Solar Chargers'].map((name, index) => ({
    id: `category-${index + 1}`,
    type: 'category',
    name,
    slug: name.toLowerCase().replace(' ', '-'),
  })),
);

// Everything the home page reads.
export const mockCatalog = ({
  verticals = VERTICALS,
  grandIndia = GRAND_INDIA,
  categories = CATEGORIES,
} = {}) =>
  server.use(
    http.get(api('/verticals'), () => success({ verticals })),
    http.get(api('/verticals/grand-india-tour'), () => success(grandIndia)),
    http.get(api('/taxonomies'), () => success({ taxonomies: categories })),
  );
