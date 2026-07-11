import { describe, expect, it } from "vitest";
import { redactUrl, redactAnalyticsEvent } from "@/lib/analytics/redact";

describe("analytics URL redaction", () => {
  it("strips the build share payload (?b=) that encodes user-owned build data", () => {
    expect(redactUrl("https://example.com/builds?b=eyJuYW1lIjoiViJ9")).toBe(
      "https://example.com/builds",
    );
  });

  it("strips ?focus= and any other non-marketing query parameters", () => {
    expect(redactUrl("https://example.com/builds?focus=abc123")).toBe("https://example.com/builds");
    expect(redactUrl("https://example.com/jobs?new=1&other=2")).toBe("https://example.com/jobs");
  });

  it("strips the hash fragment", () => {
    expect(redactUrl("https://example.com/map?b=secret#deep-link")).toBe("https://example.com/map");
  });

  it("keeps utm_* marketing parameters for campaign attribution", () => {
    expect(redactUrl("https://example.com/?utm_source=twitter&utm_medium=social")).toBe(
      "https://example.com/?utm_source=twitter&utm_medium=social",
    );
  });

  it("keeps utm_* while still stripping the sensitive build payload", () => {
    expect(
      redactUrl("https://example.com/builds?b=SECRET&utm_source=reddit&utm_campaign=launch"),
    ).toBe("https://example.com/builds?utm_source=reddit&utm_campaign=launch");
  });

  it("leaves a query-free URL untouched", () => {
    expect(redactUrl("https://example.com/dashboard")).toBe("https://example.com/dashboard");
  });

  it("redactAnalyticsEvent removes non-marketing query params and preserves the event type", () => {
    expect(
      redactAnalyticsEvent({ type: "pageview", url: "https://example.com/builds?b=SECRET" }),
    ).toEqual({ type: "pageview", url: "https://example.com/builds" });
  });
});
