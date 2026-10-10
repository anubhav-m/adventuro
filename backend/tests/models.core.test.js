import { describe, expect, it } from 'vitest';
import { GearClick } from '../src/models/GearClick.js';
import { NewsletterSubscriber } from '../src/models/NewsletterSubscriber.js';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { User } from '../src/models/User.js';
import { Vertical } from '../src/models/Vertical.js';
import { createGear, createTaxonomy, createUser, createVertical } from './helpers/factories.js';

const DUPLICATE_KEY = { code: 11000 };

describe('User', () => {
  it('applies defaults and lowercases the email', async () => {
    const user = await User.create({ googleId: 'g-1', email: '  Mixed@Example.COM ' });
    expect(user).toMatchObject({
      email: 'mixed@example.com',
      name: '',
      role: 'user',
      themePreference: 'system',
      avatarUrl: null,
      lastLoginAt: null,
    });
    expect(user.phone).toBeUndefined();
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('profileComplete requires both name and phone', async () => {
    const user = await User.create({ googleId: 'g-1', email: 'a@example.com' });
    expect(user.profileComplete).toBe(false);
    user.name = 'Asha';
    expect(user.profileComplete).toBe(false);
    user.phone = '9876543210';
    expect(user.profileComplete).toBe(true);
    user.name = '';
    expect(user.profileComplete).toBe(false);
  });

  it('toJSON exposes id and profileComplete and hides googleId, _id and __v', async () => {
    const user = await createUser();
    const json = user.toJSON();
    expect(json.id).toBe(String(user._id));
    expect(json.profileComplete).toBe(true);
    expect(json).not.toHaveProperty('googleId');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(JSON.stringify(user)).not.toContain(user.googleId);
  });

  it.each([
    ['phone', '5876543210'],
    ['phone', '98765'],
    ['role', 'superadmin'],
    ['themePreference', 'sepia'],
    ['name', 'x'.repeat(121)],
  ])('rejects invalid %s (%s)', async (field, value) => {
    await expect(createUser({ [field]: value })).rejects.toMatchObject({
      name: 'ValidationError',
      errors: { [field]: expect.anything() },
    });
  });

  it('requires googleId and email', async () => {
    await expect(User.create({})).rejects.toMatchObject({
      errors: { googleId: expect.anything(), email: expect.anything() },
    });
  });

  it.each([
    ['googleId', { googleId: 'same' }],
    ['email', { email: 'same@example.com' }],
    ['phone', { phone: '9876543210' }],
  ])('enforces a unique %s', async (field, overrides) => {
    await createUser(overrides);
    await expect(createUser(overrides)).rejects.toMatchObject({
      ...DUPLICATE_KEY,
      keyPattern: { [field]: 1 },
    });
  });

  it('allows many users without a phone (sparse index)', async () => {
    await createUser({ phone: undefined });
    await createUser({ phone: undefined });
    expect(await User.countDocuments()).toBe(2);
  });
});

describe('Vertical', () => {
  it('stores content with defaults', async () => {
    const vertical = await Vertical.create({
      key: 'peakpulse',
      code: 'PP',
      name: 'PeakPulse',
      order: 3,
    });
    expect(vertical.toJSON()).toMatchObject({
      id: String(vertical._id),
      key: 'peakpulse',
      code: 'PP',
      subtitle: '',
      description: '',
      heroImage: null,
    });
    expect(vertical.toJSON()).not.toHaveProperty('_id');
  });

  it('stores a hero image without a subdocument id', async () => {
    const vertical = await createVertical({
      heroImage: { url: 'https://cdn.example.com/hero.webp', path: 'verticals/hero.webp' },
    });
    expect(vertical.toJSON().heroImage).toEqual({
      url: 'https://cdn.example.com/hero.webp',
      path: 'verticals/hero.webp',
    });
  });

  it.each([
    ['key', 'atlantis'],
    ['code', 'ZZ'],
    ['order', 0],
    ['name', ''],
  ])('rejects invalid %s (%s)', async (field, value) => {
    await expect(createVertical({ [field]: value })).rejects.toMatchObject({
      errors: { [field]: expect.anything() },
    });
  });

  it('enforces unique key and code', async () => {
    await createVertical();
    await expect(createVertical({ code: 'GS' })).rejects.toMatchObject(DUPLICATE_KEY);
    await expect(createVertical({ key: 'goldensaga' })).rejects.toMatchObject(DUPLICATE_KEY);
  });
});

describe('Taxonomy', () => {
  it('creates an item and serializes with id', async () => {
    const taxonomy = await createTaxonomy({ name: ' Water Gear ', slug: 'Water-Gear' });
    expect(taxonomy.toJSON()).toMatchObject({
      id: String(taxonomy._id),
      type: 'category',
      name: 'Water Gear',
      slug: 'water-gear',
    });
  });

  it.each([
    ['type', 'brand'],
    ['slug', 'not a slug'],
    ['name', ''],
  ])('rejects invalid %s (%s)', async (field, value) => {
    await expect(createTaxonomy({ [field]: value })).rejects.toMatchObject({
      errors: { [field]: expect.anything() },
    });
  });

  it('enforces a unique slug within a type but allows it across types', async () => {
    await createTaxonomy({ type: 'category', slug: 'desert' });
    await expect(createTaxonomy({ type: 'category', slug: 'desert' })).rejects.toMatchObject({
      ...DUPLICATE_KEY,
      keyPattern: { type: 1, slug: 1 },
    });
    await createTaxonomy({ type: 'climate', slug: 'desert' });
    expect(await Taxonomy.countDocuments({ slug: 'desert' })).toBe(2);
  });
});

describe('GearClick', () => {
  it('logs a click with an optional user and only a createdAt timestamp', async () => {
    const [gear, user] = await Promise.all([createGear(), createUser()]);
    const anonymous = await GearClick.create({ gear: gear._id });
    const signedIn = await GearClick.create({ gear: gear._id, user: user._id });

    expect(anonymous.user).toBeNull();
    expect(anonymous.createdAt).toBeInstanceOf(Date);
    expect(anonymous.updatedAt).toBeUndefined();
    expect(signedIn.toJSON()).toMatchObject({ id: String(signedIn._id), user: user._id });
  });

  it('stores nothing beyond gear, user and createdAt (no IP or user agent)', () => {
    expect(Object.keys(GearClick.schema.paths).sort()).toEqual([
      '__v',
      '_id',
      'createdAt',
      'gear',
      'user',
    ]);
  });

  it('requires gear', async () => {
    await expect(GearClick.create({})).rejects.toMatchObject({
      errors: { gear: expect.anything() },
    });
  });
});

describe('NewsletterSubscriber', () => {
  it('stores the email lowercased and trimmed', async () => {
    const subscriber = await NewsletterSubscriber.create({ email: '  Hello@Example.com ' });
    expect(subscriber.toJSON()).toMatchObject({
      id: String(subscriber._id),
      email: 'hello@example.com',
    });
  });

  it.each(['', 'not-an-email', 'a@b', 'a b@example.com'])(
    'rejects invalid email "%s"',
    async (email) => {
      await expect(NewsletterSubscriber.create({ email })).rejects.toMatchObject({
        errors: { email: expect.anything() },
      });
    },
  );

  it('enforces a unique email regardless of case', async () => {
    await NewsletterSubscriber.create({ email: 'dup@example.com' });
    await expect(NewsletterSubscriber.create({ email: 'DUP@example.com' })).rejects.toMatchObject({
      ...DUPLICATE_KEY,
      keyPattern: { email: 1 },
    });
  });
});
