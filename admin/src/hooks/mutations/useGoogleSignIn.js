import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forbiddenError } from '../../api/ApiError.js';
import { signInWithGoogle, signOut } from '../../api/auth.api.js';
import { queryKeys } from '../../api/queryKeys.js';
import { ROLES } from '../../lib/constants.js';

// Google signs anyone in, and the backend gives them a session. An account that is not an
// admin is signed straight out again and refused, so it never becomes this app's session.
const signInAsAdmin = async (credential) => {
  const user = await signInWithGoogle(credential);
  if (user.role === ROLES.ADMIN) return user;
  await signOut();
  throw forbiddenError();
};

export const useGoogleSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signInAsAdmin,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
};
