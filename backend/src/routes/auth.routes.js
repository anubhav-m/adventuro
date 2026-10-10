import { Router } from 'express';
import { getMe, googleSignIn, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { googleSignInBody } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/google', authLimiter, validate({ body: googleSignInBody }), googleSignIn);
authRouter.get('/me', requireAuth, getMe);
authRouter.post('/logout', logout);
