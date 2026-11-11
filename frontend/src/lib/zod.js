import { z } from 'zod';

// Zod probes for eval when a schema is defined, which the Content-Security-Policy blocks and
// reports. Schemas import `z` from here, so the probe is switched off before the first one.
z.config({ jitless: true });

export { z };
