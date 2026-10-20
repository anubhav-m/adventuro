import { LIMITS } from '../lib/constants.js';

// Every item of a paginated list, read page by page at the largest page size.
// `listPage(params, { signal })` is one of the list calls; `field` names its items ('tours').
export const collectPages = async (listPage, field, { signal } = {}) => {
  const items = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
    const result = await listPage({ page, limit: LIMITS.PAGE_LIMIT_MAX }, { signal });
    items.push(...result[field]);
    totalPages = result.meta.totalPages;
  }
  return items;
};
