import { z } from 'zod';
import { searchTerm } from './common.js';

export const searchQuery = z.object({ q: searchTerm });
