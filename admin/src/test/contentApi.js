import { http } from 'msw';
import { GEAR_LIST, pageMeta, TAXONOMIES, TOUR_LIST, VERTICAL_LIST } from './fixtures.js';
import { api, server, success } from './server.js';

// The lists the editors read their choices from: verticals, the three taxonomies, every tour
// and one page of gear.
export const serveContentLists = () =>
  server.use(
    http.get(api('/admin/verticals'), () => success({ verticals: VERTICAL_LIST })),
    http.get(api('/admin/taxonomies'), ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      return success({ taxonomies: TAXONOMIES[type] ?? [] });
    }),
    http.get(api('/admin/tours'), () =>
      success({ tours: TOUR_LIST }, { meta: pageMeta(TOUR_LIST.length) }),
    ),
    http.get(api('/admin/gear'), () =>
      success({ gear: GEAR_LIST }, { meta: pageMeta(GEAR_LIST.length) }),
    ),
  );
