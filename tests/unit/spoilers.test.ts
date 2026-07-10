import { describe, expect, it } from "vitest";
import { isShielded } from "@/lib/spoilers";

describe("isShielded", () => {
  it("show_all never shields", () => {
    expect(isShielded("endgame", "show_all")).toBe(false);
    expect(isShielded("minor", "show_all")).toBe(false);
  });

  it("hide_all shields everything above none", () => {
    expect(isShielded("none", "hide_all")).toBe(false);
    expect(isShielded("minor", "hide_all")).toBe(true);
    expect(isShielded("major", "hide_all")).toBe(true);
    expect(isShielded("endgame", "hide_all")).toBe(true);
  });

  it("hide_major shields only major and endgame", () => {
    expect(isShielded("none", "hide_major")).toBe(false);
    expect(isShielded("minor", "hide_major")).toBe(false);
    expect(isShielded("major", "hide_major")).toBe(true);
    expect(isShielded("endgame", "hide_major")).toBe(true);
  });

  it("individually revealed keys bypass the shield", () => {
    expect(isShielded("endgame", "hide_all", ["ending:the-sun"], "ending:the-sun")).toBe(false);
    expect(isShielded("endgame", "hide_all", ["ending:other"], "ending:the-sun")).toBe(true);
  });
});
