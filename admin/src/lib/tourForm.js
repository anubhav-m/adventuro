// A package not filled in yet. Its price is '', which the form's schema refuses with its own
// message (NaN would never compare equal, so the form would always look changed).
export const EMPTY_TIER = Object.freeze({ name: '', description: '', pricePerPerson: '' });

// The tour editor's starting point for a new tour: one empty package, everything else blank.
export const EMPTY_TOUR_VALUES = Object.freeze({
  vertical: '',
  title: '',
  slug: '',
  state: '',
  destination: '',
  tagline: '',
  overview: '',
  durationDays: '',
  difficulty: '',
  isPublished: false,
  coverImage: null,
  gallery: [],
  signatureActivity: { title: '', description: '' },
  topActivities: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  tiers: [{ ...EMPTY_TIER }],
  reporting: { location: '', address: '', time: '' },
});

const toImage = (image) => (image ? { url: image.url, path: image.path ?? null } : null);

// GET /admin/tours/:id → the form's values.
export const toTourFormValues = (tour) => ({
  vertical: tour.vertical.id,
  title: tour.title,
  slug: tour.slug,
  state: tour.state,
  destination: tour.destination,
  tagline: tour.tagline ?? '',
  overview: tour.overview,
  durationDays: tour.durationDays,
  difficulty: tour.difficulty,
  isPublished: tour.isPublished,
  coverImage: toImage(tour.coverImage),
  gallery: tour.gallery.map(toImage),
  signatureActivity: {
    title: tour.signatureActivity.title,
    description: tour.signatureActivity.description,
  },
  topActivities: [...tour.topActivities],
  itinerary: tour.itinerary.map(({ day, title, description }) => ({
    day,
    title,
    description: description ?? '',
  })),
  inclusions: [...tour.inclusions],
  exclusions: [...tour.exclusions],
  tiers: tour.tiers.map(({ id, name, description, pricePerPerson }) => ({
    id,
    name,
    description: description ?? '',
    pricePerPerson,
  })),
  reporting: {
    location: tour.reporting.location,
    address: tour.reporting.address ?? '',
    time: tour.reporting.time,
  },
});

// The checked form values → the request body. A new tour's packages carry no ids; an edited
// tour's saved packages keep theirs.
export const toTourBody = (values, { isNew }) => ({
  ...values,
  tiers: values.tiers.map(({ id, ...tier }) => (isNew || !id ? tier : { id, ...tier })),
});

// The editor's tabs, in order, with the form fields each one holds. A tab is flagged when any
// of its fields has an error.
export const TOUR_TABS = Object.freeze([
  Object.freeze({
    id: 'basics',
    label: 'Basics',
    fields: [
      'vertical',
      'title',
      'slug',
      'state',
      'destination',
      'tagline',
      'overview',
      'durationDays',
      'difficulty',
      'isPublished',
    ],
  }),
  Object.freeze({ id: 'media', label: 'Media', fields: ['coverImage', 'gallery'] }),
  Object.freeze({
    id: 'experience',
    label: 'Experience',
    fields: ['signatureActivity', 'topActivities'],
  }),
  Object.freeze({ id: 'itinerary', label: 'Itinerary', fields: ['itinerary'] }),
  Object.freeze({
    id: 'lists',
    label: 'Inclusions / Exclusions',
    fields: ['inclusions', 'exclusions'],
  }),
  Object.freeze({ id: 'packages', label: 'Packages', fields: ['tiers'] }),
  Object.freeze({ id: 'reporting', label: 'Reporting', fields: ['reporting'] }),
  Object.freeze({ id: 'gear', label: 'Gear', fields: [] }),
]);

// The ids of the tabs that hold an error, in tab order.
export const flaggedTabs = (errors) =>
  TOUR_TABS.filter(({ fields }) => fields.some((field) => errors[field])).map(({ id }) => id);
