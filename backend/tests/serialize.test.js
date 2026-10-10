import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { containsRegex, exactRegex } from '../src/utils/escapeRegex.js';
import { serialize } from '../src/utils/serialize.js';

const { ObjectId } = mongoose.Types;

describe('serialize', () => {
  it('maps _id to a string id and drops __v', () => {
    const _id = new ObjectId();
    expect(serialize({ _id, __v: 3, name: 'Pack' })).toEqual({ id: String(_id), name: 'Pack' });
  });

  it('applies to nested documents, arrays and bare ObjectId references', () => {
    const [docId, tierId, refId, populatedId] = [1, 2, 3, 4].map(() => new ObjectId());
    const result = serialize({
      _id: docId,
      tiers: [{ _id: tierId, name: 'Essential', pricePerPerson: 14999 }],
      tours: [refId],
      category: { _id: populatedId, __v: 0, name: 'Shoes' },
      reporting: { location: 'Airport', time: '10:30' },
    });

    expect(result).toEqual({
      id: String(docId),
      tiers: [{ id: String(tierId), name: 'Essential', pricePerPerson: 14999 }],
      tours: [String(refId)],
      category: { id: String(populatedId), name: 'Shoes' },
      reporting: { location: 'Airport', time: '10:30' },
    });
  });

  it('leaves primitives, null and dates untouched', () => {
    const createdAt = new Date('2026-10-11T00:00:00.000Z');
    expect(serialize({ a: 1, b: 'x', c: false, d: null, createdAt })).toEqual({
      a: 1,
      b: 'x',
      c: false,
      d: null,
      createdAt,
    });
    expect(serialize(null)).toBeNull();
    expect(serialize([])).toEqual([]);
  });

  it('does not mutate its input', () => {
    const doc = { _id: new ObjectId(), __v: 0, nested: { _id: new ObjectId() } };
    serialize(doc);
    expect(doc).toHaveProperty('_id');
    expect(doc).toHaveProperty('__v');
    expect(doc.nested).toHaveProperty('_id');
  });
});

describe('regex helpers', () => {
  it('containsRegex matches a literal, case-insensitive substring', () => {
    expect(containsRegex('goa').test('North GOA Escape')).toBe(true);
    expect(containsRegex('.*').test('anything')).toBe(false);
    expect(containsRegex('.*').test('a .* b')).toBe(true);
    expect(containsRegex('(').test('Flask (1L)')).toBe(true);
  });

  it('exactRegex matches the whole value only', () => {
    expect(exactRegex('goa').test('Goa')).toBe(true);
    expect(exactRegex('goa').test('Goa Border')).toBe(false);
    expect(exactRegex('g.a').test('Goa')).toBe(false);
  });
});
