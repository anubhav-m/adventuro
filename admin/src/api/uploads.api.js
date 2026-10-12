import { request } from './client.js';

// The multipart field the backend reads the file from.
const UPLOAD_FIELD = 'image';

// `folder` is 'tours', 'gear' or 'verticals'. Resolves to the stored image: { url, path }.
export const uploadImage = async (file, folder) => {
  const body = new FormData();
  body.append(UPLOAD_FIELD, file);
  const { image } = await request('/admin/uploads', { method: 'POST', params: { folder }, body });
  return image;
};

// For an upload that was never saved on a tour, a gear item or a vertical.
export const deleteUpload = (path) =>
  request('/admin/uploads', { method: 'DELETE', body: { path } });
