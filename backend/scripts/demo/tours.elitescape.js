import { demoTour } from './helpers.js';

const verticalKey = 'elitescape';

export const ELITESCAPE_TOURS = [
  demoTour({
    verticalKey,
    slug: 'udaipur-lake-palace-retreat',
    title: 'Udaipur Lake Palace Retreat',
    state: 'Rajasthan',
    destination: 'Udaipur',
    tagline: 'Four unhurried days on Lake Pichola',
    overview:
      'A palace stay on the water, a private boat at sunset, a chef-led Mewari dinner on a rooftop and a vintage car to carry you between them. Everything is arranged; nothing is rushed.',
    difficulty: 'easy',
    basePrice: 74999,
    topActivities: ['Private sunset cruise', 'Palace stay', 'Vintage car tour', 'Spa ritual'],
    signatureActivity: {
      title: 'Private sunset cruise with dinner on Jag Mandir',
      description:
        'Your own boat across Lake Pichola at golden hour, ending with a candlelit dinner on the island palace of Jag Mandir.',
    },
    days: [
      [
        'Arrival by vintage car',
        'Chauffeured pickup, a welcome ceremony and an evening at leisure by the lake.',
      ],
      [
        'The City Palace, privately',
        'A curator-led tour of the City Palace and the crystal gallery, then a spa ritual.',
      ],
      ['Sunset on the lake', 'A slow morning, then the private cruise and dinner on Jag Mandir.'],
      ['Departure', 'Breakfast on the terrace and a chauffeured transfer to the airport.'],
    ],
    inclusions: [
      '3 nights palace stay with all meals',
      'Private chauffeur and vintage car',
      'Private cruise and island dinner',
      'One spa ritual per guest',
    ],
    reporting: {
      location: 'Maharana Pratap Airport',
      address: 'Arrivals, Dabok, Udaipur 313022',
      time: '13:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'kerala-private-houseboat-escape',
    title: 'Kerala Private Houseboat Escape',
    state: 'Kerala',
    destination: 'Kumarakom and Alleppey',
    tagline: 'The backwaters, with the boat to yourself',
    overview:
      'Five days in the Kerala backwaters: a lakeside villa in Kumarakom, two nights on a private houseboat with your own chef, and an Ayurvedic therapy to finish.',
    difficulty: 'easy',
    basePrice: 64999,
    topActivities: [
      'Private houseboat',
      'Ayurvedic therapy',
      'Canoe through village canals',
      'Chef’s table',
    ],
    signatureActivity: {
      title: 'Two nights on a private houseboat',
      description:
        'A crewed kettuvallam reserved for your party alone, drifting through the Vembanad backwaters with a private chef on board.',
    },
    days: [
      ['Arrive in Kochi', 'Chauffeured drive to a lakeside villa in Kumarakom.'],
      ['Kumarakom', 'Bird sanctuary by boat at dawn and an Ayurvedic consultation.'],
      ['Board the houseboat', 'Cruise from Kumarakom towards Alleppey with lunch on deck.'],
      ['Village canals', 'A canoe through the narrow canals and a chef’s table dinner on board.'],
      ['Departure', 'Disembark in Alleppey and transfer to Kochi airport.'],
    ],
    inclusions: [
      '2 nights villa and 2 nights private houseboat',
      'All meals with a private chef',
      'Chauffeured transfers',
      'One Ayurvedic therapy per guest',
    ],
    reporting: {
      location: 'Cochin International Airport',
      address: 'Arrivals, Terminal 1, Nedumbassery, Kochi 683111',
      time: '11:30',
    },
  }),
];
