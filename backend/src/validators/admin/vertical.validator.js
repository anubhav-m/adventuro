import { z } from 'zod';
import { LIMITS } from '../../config/constants.js';
import { AT_LEAST_ONE_FIELD, image, optionalText } from '../common.js';

export const updateVerticalBody = z
  .object({
    subtitle: optionalText(LIMITS.SHORT_TEXT_MAX),
    description: optionalText(LIMITS.LONG_TEXT_MAX),
    heroImage: image.nullable().optional(),
  })
  .strict()
  .refine(...AT_LEAST_ONE_FIELD);
