import { z } from 'zod';
import { slug } from './common.js';

export const verticalKeyParams = z.object({ key: slug });
