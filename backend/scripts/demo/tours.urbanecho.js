import { demoTour } from './helpers.js';

const verticalKey = 'urbanecho';

export const URBANECHO_TOURS = [
  demoTour({
    verticalKey,
    slug: 'mumbai-after-dark',
    title: 'Mumbai After Dark',
    state: 'Maharashtra',
    destination: 'Mumbai',
    tagline: 'The city that eats, rides and dances at midnight',
    overview:
      'Three days tuned to Mumbai’s late hours: a midnight cycle ride through empty South Mumbai, street food at Mohammed Ali Road, a Bollywood studio visit and a sunset sail off the Gateway.',
    difficulty: 'easy',
    basePrice: 11999,
    topActivities: [
      'Midnight cycling',
      'Street food crawl',
      'Bollywood studio tour',
      'Harbour sail',
    ],
    signatureActivity: {
      title: 'Midnight cycle ride through South Mumbai',
      description:
        'Ride from Colaba to Marine Drive and back past CST and the Gateway when the streets are empty and the buildings are lit.',
    },
    days: [
      [
        'Arrival and harbour sail',
        'Check in at Colaba and a sunset sail from the Gateway of India.',
      ],
      [
        'Studios and street food',
        'Film City studio tour, then a street food crawl and the midnight cycle ride.',
      ],
      ['Bazaars and departure', 'Crawford Market, Kala Ghoda art district and transfer out.'],
    ],
    inclusions: [
      '2 nights stay with breakfast',
      'Cycle and safety gear',
      'Street food tasting',
      'Studio tour and harbour sail',
    ],
    reporting: {
      location: 'Gateway of India',
      address: 'Apollo Bandar, Colaba, Mumbai 400001',
      time: '15:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'old-delhi-food-and-heritage-walks',
    title: 'Old Delhi Food & Heritage Walks',
    state: 'Delhi',
    destination: 'Old and New Delhi',
    tagline: 'Seven cities of Delhi, one plate at a time',
    overview:
      'Walk and eat your way through Delhi: a rickshaw food trail through Chandni Chowk, the Mughal monuments at dawn, and an evening of qawwali at Nizamuddin.',
    difficulty: 'easy',
    basePrice: 9499,
    topActivities: [
      'Chandni Chowk food trail',
      'Humayun’s Tomb at sunrise',
      'Qawwali evening',
      'Metro and rickshaw hops',
    ],
    signatureActivity: {
      title: 'Rickshaw food trail through Chandni Chowk',
      description:
        'Ten tastings across the lanes of Old Delhi by cycle rickshaw, from paranthe wali gali to the spice market at Khari Baoli.',
    },
    days: [
      ['Old Delhi', 'Jama Masjid, the Chandni Chowk food trail and the spice market.'],
      ['Mughal Delhi', 'Humayun’s Tomb at sunrise, Lodhi Garden and qawwali at Nizamuddin.'],
      [
        'New Delhi and departure',
        'Qutub Minar, India Gate and a farewell lunch at Connaught Place.',
      ],
    ],
    inclusions: [
      '2 nights stay with breakfast',
      'All food tastings',
      'Monument entries',
      'Storyteller guide',
    ],
    reporting: {
      location: 'Chandni Chowk Metro Station',
      address: 'Gate 5, Chandni Chowk, Delhi 110006',
      time: '09:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'bengaluru-brews-and-bazaars',
    title: 'Bengaluru Brews & Bazaars',
    state: 'Karnataka',
    destination: 'Bengaluru',
    tagline: 'Filter coffee at dawn, craft beer at dusk',
    overview:
      'A two-day city break through Bengaluru’s old markets and new taprooms: a dawn walk through the flower market, breakfast at a 1920s tiffin room and a guided craft brewery trail.',
    difficulty: 'easy',
    basePrice: 6999,
    topActivities: [
      'Craft brewery trail',
      'KR Market flower walk',
      'Tiffin room breakfast',
      'Lalbagh garden',
    ],
    signatureActivity: {
      title: 'Guided craft brewery trail',
      description:
        'Three of the city’s best microbreweries in one evening with a brewer, including tastings and a look behind the tanks.',
    },
    days: [
      [
        'Markets and brews',
        'KR Market at dawn, a tiffin room breakfast, Lalbagh and the evening brewery trail.',
      ],
      [
        'Pete and departure',
        'A walk through the old Pete, Tipu’s summer palace and lunch on Church Street.',
      ],
    ],
    inclusions: [
      '1 night stay with breakfast',
      'Brewery tastings',
      'Market walk guide',
      'Local transfers',
    ],
    reporting: {
      location: 'KR Market Metro Station',
      address: 'Exit A, Kalasipalya, Bengaluru 560002',
      time: '06:00',
    },
  }),
];
