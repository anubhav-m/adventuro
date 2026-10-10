import { signInWithGoogle, signSessionToken } from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.js';
import { sendSuccess } from '../utils/response.js';

export const googleSignIn = async (req, res, next) => {
  try {
    const user = await signInWithGoogle(req.validated.body.credential);
    setAuthCookie(res, signSessionToken(user.id));
    return sendSuccess(res, { message: 'Signed in', data: { user } });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, { message: 'Session restored', data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req, res, next) => {
  try {
    clearAuthCookie(res);
    return sendSuccess(res, { message: 'Signed out' });
  } catch (err) {
    next(err);
  }
};
