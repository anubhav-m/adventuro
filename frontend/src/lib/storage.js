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
