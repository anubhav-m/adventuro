import { searchActiveGear } from './gear.service.js';
import { searchPublishedTours } from './tour.service.js';

export const searchCatalog = async (q) => {
  const [tours, gear] = await Promise.all([searchPublishedTours(q), searchActiveGear(q)]);
  return { tours, gear };
};
