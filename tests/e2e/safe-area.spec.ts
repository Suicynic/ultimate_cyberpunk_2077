import { expect, test } from "@playwright/test";

/**
 * iPhone safe-area handling (issue #2).
 *
 * IMPORTANT: Playwright device emulation always reports env(safe-area-inset-*)
 * as 0 — it cannot synthesize the physical notch / Dynamic Island / home
 * indicator insets of real hardware. So these tests validate the *structural*
 * implementation:
 *   • the generated viewport metadata opts into viewport-fit=cover (the switch
 *     that makes iOS expose non-zero insets at all);
 *   • the safe-area utilities are applied to the edge-reaching surfaces and
 *     resolve to the preserved base spacing when the inset is 0 (which is
 *     exactly the desktop / Android / non-notched behaviour — proving there is
 *     no double-padding and no regression).
 * A real notched-iPhone Safari pass is still required to confirm the physical
 * inset values; see the PR description.
 */

test.describe("safe-area handling (issue #2)", () => {
  test("viewport metadata opts into viewport-fit=cover", async ({ page }) => {
    await page.goto("/dashboard");
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
  });

  test("sticky header applies safe-area padding and preserves base spacing", async ({ page }) => {
    await page.goto("/dashboard");
    const header = page.locator("header.sticky");
    await expect(header).toBeVisible();

    const cls = (await header.getAttribute("class")) ?? "";
    expect(cls).toContain("pt-safe");
    expect(cls).toContain("px-safe");

    // Emulation reports a 0 inset, so max(base, 0) must equal the base: the
    // header's top padding stays 0.5rem (8px). A double-padding bug would fail here.
    const paddingTop = await header.evaluate((el) => getComputedStyle(el).paddingTop);
    expect(paddingTop).toBe("8px");
    // Horizontal gutters resolve to a positive value (base ≥ 0.75rem).
    const paddingLeft = await header.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(paddingLeft).toBeGreaterThanOrEqual(12);
  });

  test("focused skip link is inset-aware and keeps its base position at 0 inset", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    // sr-only until focused; becomes a visible, interactive control on focus.
    await skip.focus();
    await expect(skip).toBeVisible();

    const cls = (await skip.getAttribute("class")) ?? "";
    expect(cls).toContain("focus:top-safe");
    expect(cls).toContain("focus:left-safe");

    // With a 0 inset, max(0.5rem, 0) keeps the link at its 8px desktop offset —
    // proving no regression while the position is now inset-aware on real devices.
    const pos = await skip.evaluate((el) => {
      const s = getComputedStyle(el);
      return { top: s.top, left: s.left };
    });
    expect(pos).toEqual({ top: "8px", left: "8px" });
  });

  test("mobile nav drawer stays full-height with inset-aware padding", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile project only");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /open navigation/i }).click();

    const drawer = page.locator("nav.fixed.inset-y-0");
    await expect(drawer).toBeVisible();

    const cls = (await drawer.getAttribute("class")) ?? "";
    expect(cls).toContain("pt-safe");
    expect(cls).toContain("pb-safe");
    expect(cls).toContain("pl-safe");

    // Full-height: spans the whole viewport (inset-y-0).
    const box = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(viewport!.height - 1);

    // With a 0 inset the padding stays at the 0.75rem (12px) base on every side,
    // so the nav controls sit exactly where they did before — reachable, not
    // under a notch or home indicator.
    const pads = await drawer.evaluate((el) => {
      const s = getComputedStyle(el);
      return { top: s.paddingTop, bottom: s.paddingBottom, left: s.paddingLeft };
    });
    expect(pads).toEqual({ top: "12px", bottom: "12px", left: "12px" });

    // The first nav control is reachable/clickable.
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link").first(),
    ).toBeVisible();
  });
});
