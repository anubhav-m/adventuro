// The gear editor's starting point for a new item: active, nothing else filled in. Prices are
// '' until entered, which the form's schema refuses with its own message.
export const EMPTY_GEAR_VALUES = Object.freeze({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  images: [],
  mrp: '',
  salePrice: '',
  affiliateUrl: '',
  category: '',
  climates: [],
  tags: [],
  tours: [],
  isActive: true,
});

const ids = (items) => items.map(({ id }) => id);

// GET /admin/gear/:id → the form's values. The server sends linked items whole; the form keeps
// their ids.
export const toGearFormValues = (gear) => ({
  name: gear.name,
  slug: gear.slug,
  shortDescription: gear.shortDescription ?? '',
  description: gear.description ?? '',
  images: gear.images.map(({ url, path }) => ({ url, path: path ?? null })),
  mrp: gear.mrp,
  salePrice: gear.salePrice,
  affiliateUrl: gear.affiliateUrl,
  category: gear.category?.id ?? '',
  climates: ids(gear.climates),
  tags: ids(gear.tags),
  tours: ids(gear.tours),
  isActive: gear.isActive,
});
