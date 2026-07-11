import { describe, expect, it } from "vitest";
import { pathnameOnly, redactAnalyticsEvent } from "@/lib/analytics/redact";

describe("analytics URL redaction", () => {
  it("strips the build share payload (?b=) that encodes user-owned build data", () => {
    expect(pathnameOnly("https://example.com/builds?b=eyJuYW1lIjoiViJ9")).toBe(
      "https://example.com/builds",
    );
  });

  it("strips ?focus= and any other query parameters", () => {
    expect(pathnameOnly("https://example.com/builds?focus=abc123")).toBe(
      "https://example.com/builds",
    );
    expect(pathnameOnly("https://example.com/jobs?new=1&other=2")).toBe("https://example.com/jobs");
  });

  it("strips the hash fragment", () => {
    expect(pathnameOnly("https://example.com/map?b=secret#deep-link")).toBe(
      "https://example.com/map",
    );
  });

  it("leaves a query-free URL untouched", () => {
    expect(pathnameOnly("https://example.com/dashboard")).toBe("https://example.com/dashboard");
  });

  it("redactAnalyticsEvent removes the query string and preserves the event type", () => {
    expect(
      redactAnalyticsEvent({ type: "pageview", url: "https://example.com/builds?b=SECRET" }),
    ).toEqual({ type: "pageview", url: "https://example.com/builds" });
  });
});
