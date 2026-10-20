import { http } from 'msw';
import { BOOKING_LIST, pageMeta, SUBSCRIBERS, USER_LIST } from './fixtures.js';
import { api, server, success } from './server.js';

// One page each of bookings, users and newsletter subscribers. Register it in `beforeEach`, so
// a test's own handlers, added later, win.
export const serveOpsLists = () =>
  server.use(
    http.get(api('/admin/bookings'), () =>
      success({ bookings: BOOKING_LIST }, { meta: pageMeta(BOOKING_LIST.length) }),
    ),
    http.get(api('/admin/users'), () =>
      success({ users: USER_LIST }, { meta: pageMeta(USER_LIST.length) }),
    ),
    http.get(api('/admin/newsletter'), () =>
      success({ subscribers: SUBSCRIBERS }, { meta: pageMeta(SUBSCRIBERS.length) }),
    ),
  );
