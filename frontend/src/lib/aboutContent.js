// The copy of the About page (Our Story), from the founder vision. Only what the product does
// today is described here.

export const STORY_SECTIONS = Object.freeze([
  Object.freeze({
    title: 'The problem with packages',
    paragraphs: [
      'Most trips are sold as packages: a hotel, a bus, and a list of places to stand in front of. You come home having visited, and not much more.',
      'What the trip needs is left to you. The right shoes, a dry bag, a jacket for the pass: you find out the night before, or on the day.',
    ],
  }),
  Object.freeze({
    title: 'What Adventuro is',
    paragraphs: [
      'Adventuro is a travel brand built around experiences. We are not a tour operator with a catalogue of packages.',
      'We plan curated trips across India, in six different styles of travel. Beside each trip we show the gear it calls for, so you can prepare for it properly.',
    ],
  }),
  Object.freeze({
    title: 'Experienced, not simply visited',
    paragraphs: [
      'Every place has something it is known for. So every Adventuro trip is built around at least one signature activity: parasailing in Goa, an ATV ride across the Thar, a food trail through an old city.',
      'Which activity it is depends on the place, the season, and what is safe on the day.',
    ],
  }),
]);

// One line per vertical, keyed like `VERTICALS` in lib/constants.js.
export const VERTICAL_STORIES = Object.freeze({
  tidetrail: 'Beaches, islands and coastal escapes, with one memorable thing to do on the water.',
  goldensaga: 'Deserts, royal towns and heritage, with an authentic desert or cultural experience.',
  peakpulse: 'Mountains, treks, camping and snow. Adventure and nature come first.',
  elitescape: 'Luxury stays, honeymoons and private trips, planned around comfort.',
  urbanecho: 'City breaks, food, culture and nightlife. The city the way a local knows it.',
  'grand-india-tour': 'One larger journey across mountains, beaches, deserts, heritage and cities.',
});

export const PROMISE_STEPS = Object.freeze([
  Object.freeze({
    name: 'Discover',
    text: 'Six kinds of trip, laid out so you can tell them apart at a glance.',
  }),
  Object.freeze({
    name: 'Experience',
    text: 'A signature activity on every trip: the thing its place is known for.',
  }),
  Object.freeze({
    name: 'Equip',
    text: 'The gear each trip calls for, shown beside it and sold by the stores we link to.',
  }),
  Object.freeze({
    name: 'Remember',
    text: 'A trip built around something you did, not only somewhere you stood.',
  }),
]);
