// The security headers of every response, in one place. The Worker's entry
// (`entry.cloudflare-pages.tsx`) adds them to whatever it answers with: a
// page, a loader's JSON, a redirect, a cache hit, or the router's own bare
// 404 and error pages, which no route or layout ever sees. Static files get
// the same list from `public/_headers`; a test keeps the two in step. The
// Vite dev server sends none of them, so the site can still be opened in an
// editor's embedded preview. Pure, unit-tested in security-headers.spec.ts.

/**
 * - `Content-Security-Policy`: only directives that restrict nothing the
 *   site does. Nobody may frame it (`frame-ancestors`, with
 *   `X-Frame-Options` for older browsers), a `<base>` can't repoint its
 *   relative links, no plugin content, and its forms post to itself only
 *   (the search boxes and /feedback do). Deliberately no `script-src`,
 *   `default-src` or `img-src`: Qwik emits inline scripts, and icons,
 *   screenshots and videos are hot-linked from whatever host each source
 *   uses, so any of those would break pages.
 * - `Permissions-Policy`: switches off device features the site never asks
 *   for, for itself and anything it might embed. Not listed, so left alone:
 *   the clipboard (the "Copy command" buttons), autoplay (the app page's
 *   muted background video) and fullscreen (the video player).
 * - No `Strict-Transport-Security`: HSTS is set for the whole zone in the
 *   Cloudflare dashboard.
 */
export const SECURITY_HEADERS: readonly (readonly [name: string, value: string])[] = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "DENY"],
  [
    "Permissions-Policy",
    "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=()",
  ],
  [
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  ],
];

/** Sets every security header on `headers`, replacing a value already there. */
export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of SECURITY_HEADERS) headers.set(name, value);
}

/** The response with the security headers (a copy: a cached or redirect response's own headers are immutable). */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
