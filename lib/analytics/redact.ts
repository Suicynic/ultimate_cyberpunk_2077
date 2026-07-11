import type { BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Reduce a URL to origin + pathname, keeping only `utm_*` marketing parameters
 * and dropping every other query parameter and the hash.
 *
 * This app embeds user-owned data in query strings — most notably build share
 * links, `/builds?b=<base64-of-build>`, whose payload decodes to the build
 * name, level, attributes, perks, and tags. That must never be transmitted, so
 * everything is stripped by default.
 *
 * `utm_*` parameters are the exception: they are non-sensitive campaign tags
 * the maintainer adds to their own marketing links, and they are the reliable
 * way to attribute social traffic (in-app browsers frequently send no
 * referrer). Keeping only the `utm_*` allowlist preserves that signal while
 * still discarding `?b=`, `?focus=`, and any future query-backed data.
 */
export function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const marketing = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_")) marketing.append(key, value);
    });
    url.search = marketing.toString();
    url.hash = "";
    return url.toString();
  } catch {
    // Not a parseable absolute URL — strip everything from the first ? or #.
    return rawUrl.split(/[?#]/)[0] ?? rawUrl;
  }
}

/**
 * `beforeSend` middleware for Vercel Web Analytics: emit every page-view and
 * custom event with its non-marketing query parameters and hash removed.
 */
export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: redactUrl(event.url) };
}
