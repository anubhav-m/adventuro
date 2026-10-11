// A stand-in for Google Identity Services. Install it once per test file, at module level: the
// app initialises Google once per page, so the first stand-in is the one that gets the callback.
// It is plain functions, not mocks, because that one callback must outlive every test.
export const installGoogleIdentity = () => {
  let onCredential = null;
  window.google = {
    accounts: {
      id: {
        initialize({ callback }) {
          onCredential = callback;
        },
        renderButton(element) {
          element.textContent = 'Continue with Google';
        },
      },
    },
  };

  // What Google does after the visitor picks an account.
  return { signInWith: (credential) => onCredential({ credential }) };
};
