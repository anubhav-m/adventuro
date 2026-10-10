import { z } from 'zod';
import { BOOKING_STATUS } from '../../config/constants.js';
import { dateOnly, objectId, pagination, searchTerm, slug } from '../common.js';

const status = z.enum(Object.values(BOOKING_STATUS));

// `from` and `to` are the IST calendar days on which the booking was made, both inclusive.
export const listAdminBookingsQuery = pagination
  .extend({
    status: status.optional(),
    vertical: slug.optional(),
    tour: objectId.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    q: searchTerm.optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ['from'],
    message: 'from must not be after to',
  });

export const updateBookingStatusBody = z.object({ status }).strict();
