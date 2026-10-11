// The home page's ground profile, coast to peak, cut into one piece per vertical. Every piece is
// drawn on the same 288 × 250 sheet, so neighbours meet at the same height; `viewBox` crops the
// sheet to the piece's own skyline. `wide` gives it that true shape when the bands sit side by
// side, and `stacked` is its height when each band is a full-width row.
export const TERRAIN = Object.freeze({
  tidetrail: {
    viewBox: '0 216 288 34',
    wide: 'xl:aspect-[288/34]',
    stacked: 'max-xl:h-8',
    path: 'M0 250C120 250 200 222 288 222V250Z',
  },
  goldensaga: {
    viewBox: '0 170 288 80',
    wide: 'xl:aspect-[288/80]',
    stacked: 'max-xl:h-10',
    path: 'M0 222C58 222 88 178 140 178C192 178 224 222 288 222V250H0Z',
  },
  urbanecho: {
    viewBox: '0 100 288 150',
    wide: 'xl:aspect-[288/150]',
    stacked: 'max-xl:h-14',
    path: 'M0 214H288V250H0ZM36 168h28v46H36ZM70 132h22v82H70ZM98 154h36v60H98ZM140 108h20v106h-20ZM166 146h32v68h-32ZM206 178h42v36h-42Z',
  },
  peakpulse: {
    viewBox: '0 0 288 250',
    wide: 'xl:aspect-[288/250]',
    stacked: 'max-xl:h-20',
    path: 'M0 214C14 214 26 192 46 172C86 132 118 6 168 22C230 42 250 244 288 244V250H0Z',
  },
  elitescape: {
    viewBox: '0 180 288 70',
    wide: 'xl:aspect-[288/70]',
    stacked: 'max-xl:h-10',
    path: 'M0 244C228 244 258 232 288 232V250H0ZM92 204h124v40H92ZM134 204a20 20 0 0 1 40 0ZM100 186h11v18h-11ZM197 186h11v18h-11Z',
  },
});

// Sea level, a dune, a city block, a peak, a palace on a lake.
export const TERRAIN_ORDER = Object.freeze(Object.keys(TERRAIN));
