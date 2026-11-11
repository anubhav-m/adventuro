import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// vercel.json is the production header set. The CSP allows the inline theme script in
// index.html by its hash, so an edit to that script must come with a new hash. Paths are from
// the app's root, where Vitest runs.
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const indexHtml = readFileSync('index.html', 'utf8');
const header = (key) =>
  vercel.headers.find(({ source }) => source === '/(.*)').headers.find((h) => h.key === key)?.value;

describe('vercel.json', () => {
  it('allows the inline theme script by its current hash', () => {
    const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    const hash = createHash('sha256').update(scripts[0][1]).digest('base64');
    expect(header('Content-Security-Policy')).toContain(`'sha256-${hash}'`);
  });

  it('forbids framing and sniffing and keeps the referrer to the origin', () => {
    expect(header('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('sends /api to the backend and every other path to the app', () => {
    expect(vercel.rewrites.map(({ source }) => source)).toEqual(['/api/:path*', '/(.*)']);
    expect(vercel.rewrites[1].destination).toBe('/index.html');
  });

  it('keeps search engines out', () => {
    expect(header('X-Robots-Tag')).toBe('noindex');
    expect(readFileSync('index.html', 'utf8')).toContain(
      '<meta name="robots" content="noindex" />',
    );
  });
});
