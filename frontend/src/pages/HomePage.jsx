import { ChooseYourAdventure } from '../components/home/ChooseYourAdventure.jsx';
import { GearCategories } from '../components/home/GearCategories.jsx';
import { GrandIndiaFeature } from '../components/home/GrandIndiaFeature.jsx';
import { HomeHero } from '../components/home/HomeHero.jsx';
import { BRAND } from '../lib/constants.js';

export function HomePage() {
  return (
    <>
      <title>{`${BRAND.NAME} · ${BRAND.HERO_TAGLINE}`}</title>
      <HomeHero />
      <ChooseYourAdventure />
      <GrandIndiaFeature />
      <GearCategories />
    </>
  );
}
