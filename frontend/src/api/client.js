import { ApiError, NETWORK_ERROR } from './ApiError.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const buildUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
};

const send = async (path, { method = 'GET', body, params, signal } = {}) => {
  try {
    return await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError({ code: NETWORK_ERROR });
  }
};

const readEnvelope = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const toApiError = (response, envelope) =>
  new ApiError({
    status: response.status,
    code: envelope?.code ?? null,
    fieldErrors: (envelope?.errors ?? []).map(({ field }) => ({ field })),
  });

// Resolves to the envelope's `data`, with `meta` alongside it when the response is paginated.
export const request = async (path, options) => {
  const response = await send(path, options);
  const envelope = await readEnvelope(response);
  if (!response.ok || envelope?.success !== true) throw toApiError(response, envelope);
  const { data = {}, meta } = envelope;
  return meta ? { ...data, meta } : data;
};

export const requestBlob = async (path, options) => {
  const response = await send(path, options);
  if (!response.ok) throw toApiError(response, await readEnvelope(response));
  return response.blob();
};
