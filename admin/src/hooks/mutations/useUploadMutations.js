import { useMutation } from '@tanstack/react-query';
import { deleteUpload, uploadImage } from '../../api/uploads.api.js';

export const useUploadImage = () =>
  useMutation({ mutationFn: ({ file, folder }) => uploadImage(file, folder) });

export const useDeleteUpload = () => useMutation({ mutationFn: deleteUpload });
