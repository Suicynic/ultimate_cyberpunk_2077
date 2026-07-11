"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { redactAnalyticsEvent } from "@/lib/analytics/redact";

/**
 * Vercel Web Analytics, hardened for this app's local-first model.
 *
 * The raw `<Analytics />` reports full page URLs. Because build share links
 * carry user-owned data in the query string (`/builds?b=…`), every event is
 * stripped to origin + pathname via `beforeSend` before it leaves the browser.
 * Analytics only reports data once Web Analytics is enabled for the project in
 * the Vercel dashboard; otherwise this renders nothing.
 */
export function Analytics() {
  return <VercelAnalytics beforeSend={redactAnalyticsEvent} />;
}
