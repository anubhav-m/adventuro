import { LIMITS, PAGE_SIZE } from './constants.js';

// A list page's URL filters → the API's query: the page as a number, and the search term only
// once it is long enough for the server to accept.
export const toListParams = ({ page, q, ...filters }) => ({
  ...filters,
  q: q.length >= LIMITS.SEARCH_MIN ? q : undefined,
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: PAGE_SIZE,
});
