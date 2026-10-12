import { useEffect } from 'react';
import { ROLES } from '../lib/constants.js';
import { useSignOut } from './mutations/useSignOut.js';
import { useMe } from './queries/useMe.js';

export const SESSION_STATUS = Object.freeze({
  LOADING: 'loading',
  ERROR: 'error',
  SIGNED_OUT: 'signedOut',
  ADMIN: 'admin',
});

// The session as this app sees it: an admin, or nobody. A signed-in account that is not an
// admin (a customer's cookie from the other app) is signed out here and reported as `denied`,
// so the login page can say why. Returns { status, user?, denied?, error?, retry? }.
export const useAdminSession = () => {
  const me = useMe();
  const { mutate, isIdle, isSuccess, isError, error } = useSignOut();
  const user = me.data;
  const isIntruder = Boolean(user) && user.role !== ROLES.ADMIN;

  useEffect(() => {
    if (isIntruder && isIdle) mutate();
  }, [isIntruder, isIdle, mutate]);

  if (me.isError) return { status: SESSION_STATUS.ERROR, error: me.error, retry: me.refetch };
  if (isIntruder && isError) return { status: SESSION_STATUS.ERROR, error, retry: mutate };
  if (me.isPending || isIntruder) return { status: SESSION_STATUS.LOADING };
  if (!user) return { status: SESSION_STATUS.SIGNED_OUT, denied: isSuccess };
  return { status: SESSION_STATUS.ADMIN, user };
};
