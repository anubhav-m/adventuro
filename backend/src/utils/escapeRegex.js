export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Both build a case-insensitive pattern in which user input is always matched literally.
export const containsRegex = (value) => new RegExp(escapeRegex(value), 'i');

export const exactRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');
