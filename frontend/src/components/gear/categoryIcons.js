import {
  Backpack,
  Droplets,
  Footprints,
  Glasses,
  HardHat,
  Luggage,
  Package,
  Snowflake,
  Tent,
} from 'lucide-react';

// Icons for the starter categories, by slug. Categories are admin-managed, so any other one
// gets the generic icon.
const CATEGORY_ICONS = {
  backpacks: Backpack,
  shoes: Footprints,
  camping: Tent,
  'water-gear': Droplets,
  'winter-gear': Snowflake,
  accessories: Glasses,
  'travel-kits': Luggage,
  caps: HardHat,
};

export const getCategoryIcon = (slug) => CATEGORY_ICONS[slug] ?? Package;
