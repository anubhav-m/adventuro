import { z } from 'zod';
import { dateOnly } from '../common.js';

export const dashboardQuery = z.object({ from: dateOnly.optional(), to: dateOnly.optional() });
