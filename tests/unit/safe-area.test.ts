import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regression coverage for issue #2 (iPhone safe-area handling). These are
 * source-level locks that guard the two structural pieces the fix depends on
 * and that automation cannot otherwise reproduce (physical insets are always 0
 * in device emulation):
 *   1. the viewport opts into viewport-fit=cover (without it iOS keeps every
 *      env(safe-area-inset-*) at 0 and the padding below is inert);
 *   2. globals.css defines reusable safe-area utilities that combine a base
 *      spacing with the inset via max() for each edge;
 *   3. the surfaces that reach a physical viewport edge actually apply them.
 * The generated <meta viewport-fit=cover> and the resolved padding are asserted
 * at runtime by tests/e2e/safe-area.spec.ts.
 */

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe("iPhone safe-area handling (issue #2)", () => {
  it("opts the viewport into viewport-fit=cover", () => {
    const layout = read("../../app/layout.tsx");
    // Present in the typed Viewport export (Next renders it into the <meta>).
    expect(layout).toMatch(/viewportFit:\s*["']cover["']/);
  });

  describe("globals.css safe-area utilities", () => {
    const css = read("../../app/globals.css");

    it("defines a utility per edge plus a horizontal shorthand", () => {
      for (const util of ["pt-safe", "pr-safe", "pb-safe", "pl-safe", "px-safe"]) {
        expect(css).toContain(`@utility ${util}`);
      }
    });

    it("combines a base spacing with the device inset via max() for every edge", () => {
      for (const side of ["top", "right", "bottom", "left"]) {
        // e.g. max(var(--sa-pt, 0px), env(safe-area-inset-top, 0px))
        const re = new RegExp(
          `max\\(\\s*var\\(--sa-[a-z]+,[^)]*\\)\\s*,\\s*env\\(safe-area-inset-${side},[^)]*\\)\\s*\\)`,
        );
        expect(css).toMatch(re);
      }
    });

    it("falls back to 0px so unsupported browsers keep the base spacing", () => {
      expect(css).toContain("env(safe-area-inset-top, 0px)");
      expect(css).toContain("var(--sa-pt, 0px)");
    });

    it("provides inset-aware position offsets for edge-anchored controls", () => {
      // top/left *position* utilities (not padding) for the focused skip link.
      expect(css).toContain("@utility top-safe");
      expect(css).toContain("@utility left-safe");
      expect(css).toMatch(
        /top:\s*max\(\s*var\(--sa-top,[^)]*\)\s*,\s*env\(safe-area-inset-top,[^)]*\)\s*\)/,
      );
      expect(css).toMatch(
        /left:\s*max\(\s*var\(--sa-left,[^)]*\)\s*,\s*env\(safe-area-inset-left,[^)]*\)\s*\)/,
      );
    });
  });

  describe("application to edge-reaching surfaces only", () => {
    const shell = read("../../components/shared/AppShell.tsx");
    // The map bottom sheet moved from the route file into the DistrictScan client
    // component when the map surface was split into focused pieces.
    const mapPage = read("../../app/map/DistrictScan.tsx");

    it("pads the sticky top header (top + horizontal insets)", () => {
      const header = shell.match(/<header[^>]*sticky top-0[^>]*>/)?.[0] ?? "";
      expect(header).toContain("pt-safe");
      expect(header).toContain("px-safe");
    });

    it("pads the fixed mobile nav drawer (top, bottom, left insets)", () => {
      const drawer = shell.match(/<nav[^>]*fixed inset-y-0[^>]*>/s)?.[0] ?? "";
      expect(drawer).toContain("pt-safe");
      expect(drawer).toContain("pb-safe");
      expect(drawer).toContain("pl-safe");
    });

    it("pads the main content horizontal gutters and the footer bottom", () => {
      expect(shell).toMatch(/<main[^>]*px-safe/s);
      expect(shell).toMatch(/<footer[^>]*pb-safe[^>]*px-safe/s);
    });

    it("pads the map mobile bottom sheet where it meets the home indicator", () => {
      expect(mapPage).toMatch(/fixed inset-x-0 bottom-0[^"]*pb-safe/);
    });

    it("positions the focused skip link clear of the top/left insets", () => {
      const skip = shell.match(/<a\s+href="#main-content"[^>]*>/s)?.[0] ?? "";
      // Inset-aware position offsets, not padding — it is an interactive control.
      expect(skip).toContain("focus:top-safe");
      expect(skip).toContain("focus:left-safe");
      // Preserves its 0.5rem base offset where the inset is 0 (desktop).
      expect(skip).toContain("[--sa-top:0.5rem]");
      expect(skip).toContain("[--sa-left:0.5rem]");
    });

    it("does not blanket every panel — the centered Dialog is left untouched", () => {
      const dialog = read("../../components/ui/Dialog.tsx");
      expect(dialog).not.toContain("-safe");
    });
  });
});
