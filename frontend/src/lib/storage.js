import { STORAGE_KEYS } from './constants.js';

// Storage can throw (private mode, blocked cookies, quota). Every call degrades to a no-op.
const createStore = (getStorage) => ({
  get(key) {
    try {
      return getStorage().getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      getStorage().setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      getStorage().removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
});

export const localStore = createStore(() => window.localStorage);
export const sessionStore = createStore(() => window.sessionStorage);

const isBookingIntent = (value) =>
  typeof value?.tourSlug === 'string' &&
  typeof value.tierId === 'string' &&
  Number.isInteger(value.travelers) &&
  typeof value.startDate === 'string';

// The booking a signed-out visitor was making. It lives in sessionStorage so it survives the
// trip through sign-in and onboarding, and is restored once on the way back.
export const bookingIntent = {
  save({ tourSlug, tierId, travelers, startDate }) {
    return sessionStore.set(
      STORAGE_KEYS.BOOKING_INTENT,
      JSON.stringify({ tourSlug, tierId, travelers, startDate }),
    );
  },
  restore() {
    try {
      const intent = JSON.parse(sessionStore.get(STORAGE_KEYS.BOOKING_INTENT));
      return isBookingIntent(intent) ? intent : null;
    } catch {
      return null;
    }
  },
  clear() {
    return sessionStore.remove(STORAGE_KEYS.BOOKING_INTENT);
  },
};
