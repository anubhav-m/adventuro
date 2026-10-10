import { demoTour } from './helpers.js';

const verticalKey = 'tidetrail';

export const TIDETRAIL_TOURS = [
  demoTour({
    verticalKey,
    slug: 'goa-coastal-escape',
    title: 'Goa Coastal Escape',
    state: 'Goa',
    destination: 'North Goa',
    tagline: 'Sun, surf and shacks along the Konkan coast',
    overview:
      'Four easy days on the Goan coast: fly above Calangute on a parasail, hop between the quieter northern beaches, wander the Latin quarter of Panaji and end each day at a beach shack with your feet in the sand.',
    difficulty: 'easy',
    basePrice: 14999,
    topActivities: ['Parasailing', 'Beach hopping', 'Sunset cruise', 'Fontainhas heritage walk'],
    signatureActivity: {
      title: 'Parasailing over Calangute',
      description:
        'Lift off from a speedboat and float 300 feet above the Arabian Sea with the whole North Goa coastline beneath you.',
    },
    days: [
      [
        'Arrival and Candolim sunset',
        'Airport pickup, check in and a welcome dinner at a beach shack.',
      ],
      [
        'Water sports day',
        'Parasailing, jet ski and a banana boat ride at Calangute, then free time at Baga.',
      ],
      [
        'Old Goa and Panaji',
        'Basilica of Bom Jesus, the lanes of Fontainhas and a sunset cruise on the Mandovi.',
      ],
      [
        'Anjuna morning and departure',
        'Breakfast by the sea, the Anjuna flea market and transfer to the airport.',
      ],
    ],
    inclusions: [
      '3 nights stay with breakfast',
      'Airport transfers',
      'Parasailing and water sports pack',
      'Mandovi sunset cruise',
    ],
    reporting: {
      location: 'Dabolim Airport',
      address: 'Arrivals gate 2, Dabolim, Goa 403801',
      time: '10:30',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'andaman-nicobar-island-odyssey',
    title: 'Andaman & Nicobar Island Odyssey',
    state: 'Andaman & Nicobar Islands',
    destination: 'Port Blair, Havelock and Neil Island',
    tagline: 'Coral reefs, white sand and water you can see through',
    overview:
      'Six days across three islands. Dive a living coral reef off Havelock, watch the sun set at Radhanagar, cycle the quiet roads of Neil Island and hear the story of the Cellular Jail in Port Blair.',
    difficulty: 'moderate',
    basePrice: 28999,
    topActivities: ['Scuba diving', 'Snorkelling', 'Radhanagar beach', 'Glass-bottom boat'],
    signatureActivity: {
      title: 'Scuba dive at Nemo Reef',
      description:
        'A guided beginner dive off Havelock Island among clownfish, parrotfish and hard coral. No swimming experience needed.',
    },
    days: [
      [
        'Arrive in Port Blair',
        'Airport pickup, Cellular Jail visit and the evening light and sound show.',
      ],
      ['Ferry to Havelock', 'Morning ferry to Swaraj Dweep and sunset at Radhanagar beach.'],
      ['Dive day', 'Scuba dive at Nemo Reef in the morning, Kalapathar beach in the afternoon.'],
      [
        'Elephant Beach',
        'Boat ride to Elephant Beach for snorkelling and a glass-bottom boat tour.',
      ],
      [
        'Neil Island',
        'Ferry to Shaheed Dweep, the natural bridge at Laxmanpur and a cycle around the island.',
      ],
      ['Return and departure', 'Ferry back to Port Blair and transfer to the airport.'],
    ],
    inclusions: [
      '5 nights stay with breakfast',
      'All inter-island ferries',
      'One guided scuba dive',
      'Snorkelling gear',
      'Airport transfers',
    ],
    reporting: {
      location: 'Veer Savarkar International Airport',
      address: 'Arrivals hall, Port Blair 744103',
      time: '09:00',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'gokarna-beach-trek',
    title: 'Gokarna Beach Trek',
    state: 'Karnataka',
    destination: 'Gokarna',
    tagline: 'Five beaches, one cliff trail',
    overview:
      'A short coastal trek linking Kudle, Om, Half Moon and Paradise beaches over forested headlands, with a night of camping above the surf.',
    difficulty: 'moderate',
    basePrice: 8999,
    topActivities: ['Coastal trekking', 'Cliff camping', 'Kayaking', 'Temple town walk'],
    signatureActivity: {
      title: 'Cliff-top camp at Paradise Beach',
      description:
        'Pitch tents on a headland reachable only on foot or by boat, with a bonfire dinner and the sound of the sea all night.',
    },
    days: [
      [
        'Gokarna town and Kudle',
        'Meet at the bus stand, visit the Mahabaleshwar temple and walk to Kudle beach.',
      ],
      [
        'The five-beach trail',
        'Trek from Kudle to Om, Half Moon and Paradise beach, and camp on the cliff.',
      ],
      ['Kayak and return', 'Morning kayaking in the cove, boat back to Gokarna and departure.'],
    ],
    inclusions: [
      '1 night guesthouse and 1 night camping',
      'All meals on the trail',
      'Trek leader',
      'Kayaking session',
    ],
    reporting: {
      location: 'Gokarna Bus Stand',
      address: 'Main Road, Gokarna, Karnataka 581326',
      time: '08:00',
    },
  }),
];
