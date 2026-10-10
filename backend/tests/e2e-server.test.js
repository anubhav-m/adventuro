import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../scripts/e2e-server.js', import.meta.url));
const BOOT_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 250;

let harness;
let baseUrl;
let authDir;
let cookies;

const findFreePort = async () => {
  const probe = createServer().listen(0);
  await once(probe, 'listening');
  const { port } = probe.address();
  probe.close();
  await once(probe, 'close');
  return port;
};

const waitUntilHealthy = async () => {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (harness.exitCode !== null) throw new Error(`Harness exited with ${harness.exitCode}`);
    const res = await fetch(`${baseUrl}/health`).catch(() => null);
    if (res?.ok) return;
    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL_MS);
    });
  }
  throw new Error('Harness did not become healthy in time');
};

const api = async (urlPath, cookie) => {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    headers: cookie ? { Cookie: `adv_session=${cookie}` } : {},
    redirect: 'manual',
  });
  return { status: res.status, body: await res.json() };
};

beforeAll(async () => {
  const port = await findFreePort();
  authDir = await mkdtemp(path.join(tmpdir(), 'adventuro-e2e-'));
  const authFile = path.join(authDir, '.auth.json');
  baseUrl = `http://127.0.0.1:${port}/api/v1`;

  harness = spawn(process.execPath, [SCRIPT, `--port=${port}`, `--auth-file=${authFile}`], {
    stdio: 'ignore',
  });
  await waitUntilHealthy();
  cookies = JSON.parse(await readFile(authFile, 'utf8'));
}, BOOT_TIMEOUT_MS);

afterAll(async () => {
  if (harness.exitCode === null) {
    harness.kill();
    await once(harness, 'exit');
  }
  await rm(authDir, { recursive: true, force: true });
});

describe('E2E harness', () => {
  it('writes one session cookie per user and nothing else', () => {
    expect(Object.keys(cookies).sort()).toEqual(['admin', 'customer', 'incompleteCustomer']);
    Object.values(cookies).forEach((cookie) => expect(cookie.split('.')).toHaveLength(3));
  });

  it('the customer cookie is a signed-in user with a complete profile', async () => {
    const res = await api('/auth/me', cookies.customer);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ role: 'user', profileComplete: true });
  });

  it('the incomplete customer has no phone yet', async () => {
    const res = await api('/auth/me', cookies.incompleteCustomer);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ role: 'user', profileComplete: false });
    expect(res.body.data.user.phone).toBeUndefined();
  });

  it('the admin cookie has the admin role and reaches admin routes', async () => {
    const me = await api('/auth/me', cookies.admin);
    const dashboard = await api('/admin/dashboard', cookies.admin);
    const asCustomer = await api('/admin/dashboard', cookies.customer);

    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe('admin');
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.totals).toEqual({
      users: 3,
      newUsers: 3,
      bookings: 3,
      bookingValue: 18749 * 2 + 16499 * 4 + 66298,
      newsletterSubscribers: 2,
    });
    expect(dashboard.body.data.topGear.map(({ slug, clicks }) => [slug, clicks])).toEqual([
      ['trailhead-45l-trek-backpack', 3],
      ['drytide-20l-dry-bag', 2],
      ['polaredge-uv400-sunglasses', 1],
    ]);
    expect(asCustomer.status).toBe(403);
  });

  it('serves the seed and demo content, and the customer’s bookings', async () => {
    const verticals = await api('/verticals');
    const tour = await api('/tours/goa-coastal-escape');
    const bookings = await api('/bookings/me', cookies.customer);
    const signedOut = await api('/auth/me');

    expect(verticals.body.data.verticals).toHaveLength(6);
    expect(tour.body.data.tour.tiers).toHaveLength(3);
    const codes = bookings.body.data.bookings.map(
      ({ bookingNumber }) => bookingNumber.match(/^ADV-([A-Z]{2})-\d{4}-000001$/)?.[1],
    );
    expect(codes.sort()).toEqual(['GS', 'PP', 'TT']);
    expect(signedOut.status).toBe(401);
  });
});
