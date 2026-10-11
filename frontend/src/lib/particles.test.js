import { describe, expect, it } from 'vitest';
import { createMarks, easeScrollSpeed, MARK_TONE, stepMarks } from './particles.js';

const SCREEN = { width: 1440, height: 900 };

const markAt = (y, depth = 1) => ({ x: 100, y, depth, sway: 0 });

describe('createMarks', () => {
  it('scales the number of marks with the screen and caps it', () => {
    const phone = createMarks(375, 800);
    const desktop = createMarks(SCREEN.width, SCREEN.height);
    const wall = createMarks(5000, 3000);

    expect(phone.length).toBeGreaterThan(0);
    expect(desktop.length).toBeGreaterThan(phone.length);
    expect(wall).toHaveLength(90);
  });

  it('places every mark on the screen', () => {
    for (const mark of createMarks(SCREEN.width, SCREEN.height)) {
      expect(mark.x).toBeGreaterThanOrEqual(0);
      expect(mark.x).toBeLessThanOrEqual(SCREEN.width);
      expect(mark.y).toBeGreaterThanOrEqual(0);
      expect(mark.y).toBeLessThanOrEqual(SCREEN.height);
    }
  });

  it('draws the nearest marks as crosses in the stronger ink, and a few in the brand ink', () => {
    const near = createMarks(SCREEN.width, SCREEN.height, () => 0.99);
    const far = createMarks(SCREEN.width, SCREEN.height, () => 0.01);

    expect(near[0].tone).toBe(MARK_TONE.BRAND);
    expect(near[1]).toMatchObject({ cross: true, tone: MARK_TONE.NEAR });
    expect(far[1]).toMatchObject({ cross: false, tone: MARK_TONE.FAR });
  });
});

describe('stepMarks', () => {
  it('lets the marks rise while the page is still', () => {
    const marks = [markAt(400)];
    stepMarks(marks, { ...SCREEN, dt: 1, scrollSpeed: 0 });
    expect(marks[0].y).toBeLessThan(400);
  });

  it('moves them faster while the page scrolls down', () => {
    const still = [markAt(400)];
    const scrolling = [markAt(400)];
    stepMarks(still, { ...SCREEN, dt: 0.1, scrollSpeed: 0 });
    stepMarks(scrolling, { ...SCREEN, dt: 0.1, scrollSpeed: 1200 });
    expect(400 - scrolling[0].y).toBeGreaterThan((400 - still[0].y) * 10);
  });

  it('carries them back down while the page scrolls up', () => {
    const marks = [markAt(400)];
    stepMarks(marks, { ...SCREEN, dt: 0.1, scrollSpeed: -1200 });
    expect(marks[0].y).toBeGreaterThan(400);
  });

  it('moves a far mark less than a near one', () => {
    const marks = [markAt(400, 1), markAt(400, 0.2)];
    stepMarks(marks, { ...SCREEN, dt: 0.1, scrollSpeed: 1200 });
    expect(400 - marks[1].y).toBeLessThan(400 - marks[0].y);
  });

  it('brings a mark that leaves one edge back in at the other', () => {
    const marks = [markAt(0), markAt(SCREEN.height)];
    stepMarks(marks, { ...SCREEN, dt: 0.1, scrollSpeed: 2000 });
    expect(marks[0].y).toBeGreaterThan(SCREEN.height - 100);
    stepMarks(marks, { ...SCREEN, dt: 0.1, scrollSpeed: -4000 });
    expect(marks[1].y).toBeLessThan(100);
  });
});

describe('easeScrollSpeed', () => {
  it('eases toward the scroll speed without jumping to it', () => {
    const speed = easeScrollSpeed(0, 1000, 1 / 60);
    expect(speed).toBeGreaterThan(0);
    expect(speed).toBeLessThan(1000);
  });

  it('settles back to rest once the page stops', () => {
    let speed = 1000;
    for (let frame = 0; frame < 240; frame += 1) speed = easeScrollSpeed(speed, 0, 1 / 60);
    expect(Math.abs(speed)).toBeLessThan(1);
  });

  it('caps a jump down the page', () => {
    expect(easeScrollSpeed(0, 1e9, 10)).toBeLessThanOrEqual(5000);
    expect(easeScrollSpeed(0, -1e9, 10)).toBeGreaterThanOrEqual(-5000);
  });
});
