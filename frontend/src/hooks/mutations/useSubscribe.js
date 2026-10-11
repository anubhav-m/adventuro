import { useMutation } from '@tanstack/react-query';
import { subscribe } from '../../api/newsletter.api.js';

export const useSubscribe = () => useMutation({ mutationFn: subscribe });
