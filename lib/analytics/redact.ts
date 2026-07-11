import type { BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Reduce a URL to origin + pathname, dropping the query string and hash.
 *
 * This app embeds user-owned data in query strings — most notably build share
 * links, `/builds?b=<base64-of-build>`, whose payload decodes to the build
 * name, level, attributes, perks, and tags. Analytics must never transmit that.
 * Redacting to pathname-only (rather than blocklisting individual params like
 * `b`) is future-proof: any query-backed route added later is covered
 * automatically.
 */
export function pathnameOnly(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    // Not a parseable absolute URL — strip everything from the first ? or #.
    return rawUrl.split(/[?#]/)[0] ?? rawUrl;
  }
}

/**
 * `beforeSend` middleware for Vercel Web Analytics: emit every page-view and
 * custom event with its query string and hash removed.
 */
export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: pathnameOnly(event.url) };
}
