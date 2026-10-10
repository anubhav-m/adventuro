import { demoTour } from './helpers.js';

const verticalKey = 'grand-india-tour';

export const GRAND_INDIA_TOURS = [
  demoTour({
    verticalKey,
    slug: 'grand-india-signature-circuit',
    title: 'Grand India Signature Circuit',
    state: 'Pan India',
    destination: 'Delhi, Rajasthan, Himachal, Goa and Kerala',
    tagline: 'From coast to camp, peak to palace — in one journey',
    overview:
      'The flagship Adventuro journey: fourteen days that cross the whole map. Old Delhi by rickshaw, the Taj at sunrise, a camp in the Thar, a flight over the Himalaya, the beaches of Goa and the backwaters of Kerala.',
    difficulty: 'moderate',
    basePrice: 149999,
    topActivities: [
      'Taj Mahal at sunrise',
      'Desert camp',
      'Himalayan paragliding',
      'Backwater houseboat',
    ],
    signatureActivity: {
      title: 'Five landscapes, five signature experiences',
      description:
        'One headline experience in every landscape: an ATV ride in the Thar, paragliding at Bir, parasailing in Goa, a houseboat in Kerala and a food trail in Old Delhi.',
    },
    days: [
      ['Arrive in Delhi', 'Airport pickup and a welcome dinner.'],
      ['Old Delhi', 'The Chandni Chowk food trail by rickshaw and the Mughal monuments.'],
      ['Agra', 'Train to Agra, the fort and sunset at Mehtab Bagh.'],
      ['Taj Mahal to Jaipur', 'Sunrise at the Taj and the drive to Jaipur.'],
      ['Jaipur', 'Amber Fort and the old city.'],
      ['Fly to Jaisalmer', 'The golden fort and its havelis.'],
      ['The Thar', 'ATV ride, camel safari and a night in the desert camp.'],
      ['Fly to the Himalaya', 'Flight to Dharamshala and the drive to Bir.'],
      ['Bir Billing', 'Tandem paragliding and a monastery walk.'],
      ['Fly to Goa', 'Transfer to the coast and an evening on the beach.'],
      ['Goa', 'Parasailing, water sports and Old Goa.'],
      ['Fly to Kochi', 'Fort Kochi and a kathakali performance.'],
      ['Backwaters', 'Board a houseboat at Alleppey for the night.'],
      ['Departure', 'Disembark and transfer to Kochi airport.'],
    ],
    inclusions: [
      '13 nights stay with breakfast and dinner',
      'All internal flights and trains',
      'Every signature experience',
      'Dedicated trip captain throughout',
    ],
    reporting: {
      location: 'Indira Gandhi International Airport',
      address: 'Arrivals, Terminal 3, New Delhi 110037',
      time: '14:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'grand-india-highlights',
    title: 'Grand India Highlights',
    state: 'Pan India',
    destination: 'Delhi, Agra, Jaipur and Goa',
    tagline: 'The essential India in nine days',
    overview:
      'A shorter cut of the Grand India circuit: the golden triangle of Delhi, Agra and Jaipur, a hot-air balloon over the Aravallis and three days on the Goan coast to finish.',
    difficulty: 'easy',
    basePrice: 89999,
    topActivities: ['Taj Mahal at sunrise', 'Hot-air balloon', 'Amber Fort', 'Goa water sports'],
    signatureActivity: {
      title: 'Hot-air balloon over Jaipur',
      description:
        'Lift off at dawn and float over the forts, villages and hills around Jaipur for an hour.',
    },
    days: [
      ['Arrive in Delhi', 'Airport pickup and a welcome dinner.'],
      ['Delhi', 'Old Delhi food trail and the monuments of New Delhi.'],
      ['Agra', 'Drive to Agra, the fort and sunset at Mehtab Bagh.'],
      ['Taj Mahal to Jaipur', 'Sunrise at the Taj and on to Jaipur via Fatehpur Sikri.'],
      ['Jaipur by balloon', 'Dawn balloon flight, Amber Fort and the City Palace.'],
      ['Fly to Goa', 'Flight to Goa and an evening at a beach shack.'],
      ['North Goa', 'Parasailing, water sports and the northern beaches.'],
      ['Old Goa', 'Churches of Old Goa, Fontainhas and a river cruise.'],
      ['Departure', 'Transfer to the airport.'],
    ],
    inclusions: [
      '8 nights stay with breakfast',
      'Internal flight and private coach',
      'Balloon flight and water sports',
      'Trip captain',
    ],
    reporting: {
      location: 'Indira Gandhi International Airport',
      address: 'Arrivals, Terminal 3, New Delhi 110037',
      time: '14:00',
    },
  }),
];
