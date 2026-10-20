import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getUser, listUsers } from '../../api/users.api.js';

// One page of the users list. The page on screen stays while the next one loads.
export const useUsers = (params) =>
  useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => listUsers(params, { signal }),
    placeholderData: keepPreviousData,
  });

// { user, bookings }: the user and their 50 most recent bookings.
export const useUser = (id) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) => getUser(id, { signal }),
  });
