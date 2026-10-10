import { describe, expect, it } from 'vitest';
import { RATE_LIMITS } from '../src/config/constants.js';
import { Booking } from '../src/models/Booking.js';
import { formatDateOnly, getIstTomorrow } from '../src/utils/dates.js';
import { authAgent } from './helpers/authAgent.js';
import { createTour, createUser } from './helpers/factories.js';

const PATH = '/api/v1/bookings';

describe('POST /api/v1/bookings rate limit', () => {
  it('returns 429 RATE_LIMITED per user once the booking limit is used up', async () => {
    const tour = await createTour();
    const [user, otherUser] = await Promise.all([createUser(), createUser()]);
    const body = {
      tourId: tour.id,
      tierId: tour.tiers[0].id,
      travelers: 1,
      startDate: formatDateOnly(getIstTomorrow()),
    };
    const agent = authAgent(user);

    for (let i = 0; i < RATE_LIMITS.BOOKING.limit; i += 1) {
      const res = await agent.post(PATH).send(body);
      expect(res.status).toBe(201);
    }

    const blocked = await agent.post(PATH).send(body);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMITED',
    });
    expect(await Booking.countDocuments({ user: user._id })).toBe(RATE_LIMITS.BOOKING.limit);

    const reads = await agent.get(`${PATH}/me`);
    expect(reads.status).toBe(200);

    const other = await authAgent(otherUser).post(PATH).send(body);
    expect(other.status).toBe(201);
  });
});
