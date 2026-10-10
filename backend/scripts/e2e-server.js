// End-to-end harness for the frontends. Development only: nothing in src/ imports this file.
// It serves the real app on an in-memory MongoDB filled with the seed and demo content,
// and writes ready-made session cookies for three users to /e2e/.auth.json.
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { ROLES } from '../src/config/constants.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { Gear } from '../src/models/Gear.js';
import { Tour } from '../src/models/Tour.js';
import { User } from '../src/models/User.js';
import { signSessionToken } from '../src/services/auth.service.js';
import { createBookingForUser } from '../src/services/booking.service.js';
import { recordGearClick } from '../src/services/gear.service.js';
import { subscribe } from '../src/services/newsletter.service.js';
import { addDays, formatDateOnly, getIstToday } from '../src/utils/dates.js';
import { runDemoSeed } from './seed-demo.js';

const DEFAULT_PORT = '5000';
const DEFAULT_AUTH_FILE = fileURLToPath(new URL('../../e2e/.auth.json', import.meta.url));
const START_DATE_DAYS_AHEAD = 30;

const USERS = {
  customer: {
    googleId: 'e2e-customer',
    email: 'customer@e2e.adventuro.test',
    name: 'Asha Customer',
    phone: '9876543210',
  },
  incompleteCustomer: {
    googleId: 'e2e-incomplete-customer',
    email: 'incomplete@e2e.adventuro.test',
    name: 'Ira Incomplete',
  },
  admin: {
    googleId: 'e2e-admin',
    email: 'admin@e2e.adventuro.test',
    name: 'Aditya Admin',
    phone: '9876543211',
    role: ROLES.ADMIN,
  },
};

// The customer's bookings: tour slug, index of the tier on that tour, travelers.
const CUSTOMER_BOOKINGS = [
  ['goa-coastal-escape', 1, 2],
  ['jaisalmer-dunes-desert-camp', 0, 4],
  ['ladakh-high-passes-expedition', 2, 1],
];

// Gear slug → affiliate clicks, so the dashboard's "top gear" has a known order.
const GEAR_CLICKS = {
  'trailhead-45l-trek-backpack': 3,
  'drytide-20l-dry-bag': 2,
  'polaredge-uv400-sunglasses': 1,
};

const NEWSLETTER_EMAILS = ['reader.one@e2e.adventuro.test', 'reader.two@e2e.adventuro.test'];

const seedBookings = async (customer) => {
  const startDate = formatDateOnly(addDays(getIstToday(), START_DATE_DAYS_AHEAD));
  for (const [slug, tierIndex, travelers] of CUSTOMER_BOOKINGS) {
    const tour = await Tour.findOne({ slug });
    await createBookingForUser(customer, {
      tourId: tour.id,
      tierId: tour.tiers[tierIndex].id,
      travelers,
      startDate,
    });
  }
};

const seedGearClicks = async () => {
  for (const [slug, clicks] of Object.entries(GEAR_CLICKS)) {
    const gear = await Gear.findOne({ slug }).select('_id').lean();
    await Promise.all(Array.from({ length: clicks }, () => recordGearClick(gear._id)));
  }
};

const writeAuthFile = async (authFile, users) => {
  const cookies = Object.fromEntries(
    Object.entries(users).map(([name, user]) => [name, signSessionToken(user.id)]),
  );
  await mkdir(path.dirname(authFile), { recursive: true });
  await writeFile(authFile, `${JSON.stringify(cookies, null, 2)}\n`);
};

if (env.NODE_ENV === 'production') {
  throw new Error('The E2E harness must not run in production');
}

const { values: args } = parseArgs({
  options: {
    port: { type: 'string', default: DEFAULT_PORT },
    'auth-file': { type: 'string', default: DEFAULT_AUTH_FILE },
  },
});
const authFile = path.resolve(args['auth-file']);

const mongoServer = await MongoMemoryServer.create();
await connectDb(mongoServer.getUri());
await runDemoSeed();
await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

const [customer, incompleteCustomer, admin] = await User.create(Object.values(USERS), {
  ordered: true,
});
await seedBookings(customer);
await Promise.all([seedGearClicks(), ...NEWSLETTER_EMAILS.map((email) => subscribe(email))]);
await writeAuthFile(authFile, { customer, incompleteCustomer, admin });

const server = app.listen(Number.parseInt(args.port, 10));
await once(server, 'listening');
logger.info({ port: server.address().port, authFile }, 'Adventuro E2E harness listening');

const stop = async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
  await disconnectDb();
  await mongoServer.stop();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
