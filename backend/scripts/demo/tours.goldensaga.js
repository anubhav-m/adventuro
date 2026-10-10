import { demoTour } from './helpers.js';

const verticalKey = 'goldensaga';

export const GOLDENSAGA_TOURS = [
  demoTour({
    verticalKey,
    slug: 'jaisalmer-dunes-desert-camp',
    title: 'Jaisalmer Dunes & Desert Camp',
    state: 'Rajasthan',
    destination: 'Jaisalmer and Sam Sand Dunes',
    tagline: 'A golden fort by day, a sky full of stars by night',
    overview:
      'Explore the living fort of Jaisalmer and its carved havelis, then head into the Thar for an ATV ride over the dunes, a camel safari at sunset and a night in a desert camp with folk music.',
    difficulty: 'easy',
    basePrice: 16499,
    topActivities: ['ATV dune ride', 'Camel safari', 'Desert camping', 'Fort walk'],
    signatureActivity: {
      title: 'ATV ride across the Sam dunes',
      description:
        'Take a quad bike over the open dunes of the Thar with an instructor, timed to finish as the sun goes down.',
    },
    days: [
      ['Arrive in the Golden City', 'Station pickup, check in and sunset at Gadisar Lake.'],
      [
        'Fort and havelis',
        'Guided walk through Jaisalmer Fort, Patwon ki Haveli and the old bazaar.',
      ],
      [
        'Into the Thar',
        'Drive to Sam, ATV ride and camel safari, then dinner and folk music at the camp.',
      ],
      [
        'Sunrise and departure',
        'Sunrise on the dunes, breakfast at camp and transfer back to Jaisalmer.',
      ],
    ],
    inclusions: [
      '2 nights hotel and 1 night desert camp',
      'Breakfast and dinner',
      'ATV ride and camel safari',
      'Fort guide',
    ],
    reporting: {
      location: 'Jaisalmer Railway Station',
      address: 'Station Road, Jaisalmer, Rajasthan 345001',
      time: '11:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'royal-rajasthan-heritage-trail',
    title: 'Royal Rajasthan Heritage Trail',
    state: 'Rajasthan',
    destination: 'Jaipur, Jodhpur and Udaipur',
    tagline: 'Three royal cities, seven days',
    overview:
      'A week through the pink, blue and white cities of Rajasthan: the forts of Jaipur, a zipline over Mehrangarh in Jodhpur and the lake palaces of Udaipur, with heritage stays along the way.',
    difficulty: 'easy',
    basePrice: 32999,
    topActivities: ['Fort zipline', 'Palace tours', 'Block-printing workshop', 'Lake boat ride'],
    signatureActivity: {
      title: 'Zipline over Mehrangarh Fort',
      description:
        'Six ziplines strung across the ramparts and lakes behind Mehrangarh, with the blue city spread out below.',
    },
    days: [
      ['Arrive in Jaipur', 'Airport pickup, check in and an evening at Chokhi Dhani.'],
      ['Amber and the old city', 'Amber Fort, City Palace, Jantar Mantar and Hawa Mahal.'],
      ['Craft day', 'Block-printing workshop in Sanganer and free time in Johari Bazaar.'],
      ['Drive to Jodhpur', 'Road journey to Jodhpur with a stop at Pushkar lake.'],
      ['Mehrangarh', 'Fort tour, zipline and a walk through the blue lanes below.'],
      ['Ranakpur to Udaipur', 'Jain temples at Ranakpur on the way to Udaipur.'],
      [
        'Lake city and departure',
        'City Palace, a boat ride on Lake Pichola and transfer to the airport.',
      ],
    ],
    inclusions: [
      '6 nights heritage stays with breakfast',
      'Private coach between cities',
      'Zipline and monument entries',
      'Local guides',
    ],
    reporting: {
      location: 'Jaipur International Airport',
      address: 'Arrivals, Terminal 2, Jaipur 302029',
      time: '12:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'pushkar-camels-and-culture',
    title: 'Pushkar Camels & Culture',
    state: 'Rajasthan',
    destination: 'Pushkar',
    tagline: 'Ghats, bazaars and a balloon over the desert',
    overview:
      'A long weekend in the holy lake town of Pushkar: evening aarti on the ghats, a camel cart ride into the dunes and a sunrise hot-air balloon flight over the Aravallis.',
    difficulty: 'easy',
    basePrice: 9999,
    topActivities: ['Hot-air balloon', 'Camel cart ride', 'Ghat aarti', 'Bazaar walk'],
    signatureActivity: {
      title: 'Sunrise hot-air balloon flight',
      description:
        'Drift over Pushkar lake, the dunes and the Aravalli hills for an hour as the town wakes up below.',
    },
    days: [
      [
        'Arrive in Pushkar',
        'Transfer from Ajmer, Brahma temple visit and evening aarti at the ghats.',
      ],
      [
        'Balloon and dunes',
        'Sunrise balloon flight, bazaar walk and a camel cart ride to a dinner in the dunes.',
      ],
      [
        'Savitri hill and departure',
        'Ropeway to the Savitri temple for the view, then transfer to Ajmer.',
      ],
    ],
    inclusions: [
      '2 nights stay with breakfast',
      'Ajmer transfers',
      'Balloon flight',
      'Camel cart ride and dune dinner',
    ],
    reporting: {
      location: 'Ajmer Junction',
      address: 'Station Road, Ajmer, Rajasthan 305001',
      time: '10:00',
    },
  }),
];
