import { demoTour } from './helpers.js';

const verticalKey = 'peakpulse';

export const PEAKPULSE_TOURS = [
  demoTour({
    verticalKey,
    slug: 'manali-solang-adventure',
    title: 'Manali & Solang Adventure',
    state: 'Himachal Pradesh',
    destination: 'Manali and Solang Valley',
    tagline: 'Fly, raft and ride through the Kullu valley',
    overview:
      'Five days of mountain adventure based in Manali: paraglide off the slopes of Solang, raft the Beas, drive up to the Atal Tunnel and warm up in the hot springs of Vashisht.',
    difficulty: 'moderate',
    basePrice: 13999,
    topActivities: ['Paragliding', 'River rafting', 'Atal Tunnel drive', 'Hot springs'],
    signatureActivity: {
      title: 'Tandem paragliding at Solang',
      description:
        'A tandem flight with a licensed pilot from the high launch point above Solang Valley, gliding down over pine forest.',
    },
    days: [
      ['Arrive in Manali', 'Check in, acclimatise and walk through Old Manali.'],
      [
        'Solang Valley',
        'Tandem paragliding and the ropeway, with the afternoon free in the valley.',
      ],
      [
        'Atal Tunnel and Sissu',
        'Drive through the tunnel into Lahaul and visit the Sissu waterfall.',
      ],
      [
        'Beas rafting',
        'Grade II–III rafting near Kullu and an evening at the Vashisht hot springs.',
      ],
      ['Hadimba and departure', 'Hadimba temple, the mall road and the evening coach out.'],
    ],
    inclusions: [
      '4 nights stay with breakfast and dinner',
      'Paragliding and rafting',
      'All local transfers',
      'Trip captain',
    ],
    reporting: {
      location: 'Manali Volvo Bus Stand',
      address: 'Mall Road, Manali, Himachal Pradesh 175131',
      time: '09:30',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'kasol-kheerganga-trek',
    title: 'Kasol & Kheerganga Trek',
    state: 'Himachal Pradesh',
    destination: 'Parvati Valley',
    tagline: 'A forest trail to a hot spring at 2,950 metres',
    overview:
      'A classic Parvati Valley trek: riverside cafés in Kasol, the village of Tosh, and a 12 km forest trail to the meadow and natural hot spring of Kheerganga, with a night under canvas.',
    difficulty: 'moderate',
    basePrice: 8499,
    topActivities: ['Kheerganga trek', 'Hot spring dip', 'Meadow camping', 'Tosh village walk'],
    signatureActivity: {
      title: 'Camp at the Kheerganga hot spring',
      description:
        'Reach the meadow by afternoon, soak in the natural hot spring and sleep in tents facing the snow line.',
    },
    days: [
      ['Kasol', 'Arrive in Kasol, riverside walk to Chalal and trek briefing.'],
      ['Tosh', 'Drive to Barshaini and walk up to Tosh village for the night.'],
      [
        'Trek to Kheerganga',
        '12 km through forest and waterfalls to the meadow, hot spring and camp.',
      ],
      ['Descend and departure', 'Trek down to Barshaini and drive back to Kasol.'],
    ],
    inclusions: [
      '2 nights guesthouse and 1 night camping',
      'All meals on the trek',
      'Certified trek leader',
      'Camping equipment',
    ],
    reporting: {
      location: 'Kasol Bus Stand',
      address: 'Manikaran Road, Kasol, Himachal Pradesh 175105',
      time: '08:30',
    },
  }),
  demoTour({
    verticalKey,
    slug: 'ladakh-high-passes-expedition',
    title: 'Ladakh High Passes Expedition',
    state: 'Ladakh',
    destination: 'Leh, Nubra and Pangong',
    tagline: 'Over Khardung La to the blue lake',
    overview:
      'Eight days at altitude: ride a motorbike over Khardung La into the Nubra valley, sleep among the dunes of Hunder, cross Shyok to Pangong Tso and return to Leh over Chang La.',
    difficulty: 'challenging',
    basePrice: 38999,
    topActivities: ['Khardung La ride', 'Pangong Tso', 'Nubra dunes', 'Monastery visits'],
    signatureActivity: {
      title: 'Motorbike ride over Khardung La',
      description:
        'Ride a Royal Enfield over one of the highest motorable passes in the world at 5,359 metres, with a backup vehicle behind you.',
    },
    days: [
      ['Arrive in Leh', 'Airport pickup and a full day of rest to acclimatise.'],
      ['Leh town', 'Shanti Stupa, Leh Palace and the market at an easy pace.'],
      ['Sham valley', 'Magnetic Hill, the Indus–Zanskar confluence and Alchi monastery.'],
      ['Khardung La to Nubra', 'Ride over the pass and descend to Hunder for the night.'],
      ['Nubra valley', 'Diskit monastery and a walk on the Hunder dunes.'],
      ['Shyok to Pangong', 'Follow the Shyok river to Pangong Tso and camp by the lake.'],
      ['Chang La to Leh', 'Sunrise at the lake and the ride back over Chang La.'],
      ['Departure', 'Transfer to Leh airport.'],
    ],
    inclusions: [
      '7 nights stay with breakfast and dinner',
      'Motorbike with fuel',
      'Backup vehicle and mechanic',
      'Inner line permits',
      'Oxygen cylinder',
    ],
    reporting: {
      location: 'Kushok Bakula Rimpochee Airport',
      address: 'Arrivals, Leh, Ladakh 194101',
      time: '08:00',
    },
  }),
  {
    ...demoTour({
      verticalKey,
      slug: 'spiti-valley-winter-expedition',
      title: 'Spiti Valley Winter Expedition',
      state: 'Himachal Pradesh',
      destination: 'Kaza and Kibber',
      tagline: 'The cold desert under snow',
      overview:
        'A winter crossing into Spiti by the Kinnaur road, with homestays in Kaza, the frozen village of Kibber and a day tracking snow leopards with local spotters. Opening for bookings soon.',
      difficulty: 'challenging',
      basePrice: 44999,
      topActivities: [
        'Snow leopard tracking',
        'Key monastery',
        'Frozen waterfall walk',
        'Homestays',
      ],
      signatureActivity: {
        title: 'Snow leopard tracking in Kibber',
        description:
          'Spend a day with local spotters scanning the ridges of the Kibber wildlife sanctuary for the grey ghost of the Himalaya.',
      },
      days: [
        ['Shimla to Narkanda', 'Meet in Shimla and drive to Narkanda.'],
        ['Narkanda to Kalpa', 'Along the Sutlej into Kinnaur.'],
        ['Kalpa to Tabo', 'Enter Spiti through Nako and reach Tabo monastery.'],
        ['Tabo to Kaza', 'Dhankar monastery on the way to Kaza.'],
        ['Key and Kibber', 'Key monastery and the drive up to Kibber.'],
        ['Tracking day', 'A full day with spotters in the sanctuary.'],
        ['Langza and Komic', 'High villages above Kaza, weather permitting.'],
        ['Kaza to Kalpa', 'Begin the return journey.'],
        ['Kalpa to Shimla', 'Drive back to Shimla and departure.'],
      ],
      inclusions: [
        '8 nights homestays and hotels',
        'All meals',
        '4x4 vehicle',
        'Local spotters and guide',
      ],
      reporting: {
        location: 'Shimla Old Bus Stand',
        address: 'Cart Road, Shimla, Himachal Pradesh 171001',
        time: '07:00',
      },
    }),
    isPublished: false,
  },
];
