import { z } from 'zod';
import { ROLES } from '../../config/constants.js';
import { pagination, searchTerm } from '../common.js';

export const listAdminUsersQuery = pagination.extend({
  q: searchTerm.optional(),
  role: z.enum(Object.values(ROLES)).optional(),
});
