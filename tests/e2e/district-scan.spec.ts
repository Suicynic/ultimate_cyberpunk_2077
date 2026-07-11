import { expect, test } from "@playwright/test";

/**
 * District Scan map polish — behaviours that need the real Leaflet map and a
 * real viewport: declustered overlapping markers, keyboard operation of
 * markers, the mobile detail sheet, and the selected-marker visual state.
 */

const marker = (id: string) => `.ncmap-marker[data-marker-id="${id}"]`;

async function gotoMap(page: import("@playwright/test").Page) {
  await page.goto("/map");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // Markers are added imperatively once the map is ready.
  await expect(page.locator(".ncmap-marker").first()).toBeVisible();
}

test.describe("district scan map", () => {
  test("overlapping Watson markers are individually selectable", async ({ page }) => {
    await gotoMap(page);

    // Megabuilding H10 (40,22) and Tarot: The Fool (39,24) are nearly coincident
    // in the source data; declustering must keep both separately clickable.
    await page.locator(marker("marker:megabuilding-h10")).click();
    const panel = page.getByTestId("detail-panel");
    await expect(panel.getByRole("heading", { name: "Megabuilding H10" })).toBeVisible();
    await expect(page.locator(marker("marker:megabuilding-h10"))).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.locator(marker("marker:tarot-the-fool")).click();
    await expect(panel.getByRole("heading", { name: "Tarot: The Fool" })).toBeVisible();
    // Selection moved: the previously selected marker is no longer pressed.
    await expect(page.locator(marker("marker:tarot-the-fool"))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(marker("marker:megabuilding-h10"))).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("a marker can be focused and activated from the keyboard", async ({ page }) => {
    await gotoMap(page);

    const afterlife = page.locator(marker("marker:afterlife"));
    await afterlife.focus();
    await expect(afterlife).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(afterlife).toHaveAttribute("aria-pressed", "true");
    await expect(afterlife).toHaveClass(/is-selected/);
    await expect(
      page.getByTestId("detail-panel").getByRole("heading", { name: "Afterlife" }),
    ).toBeVisible();
  });

  test("a deep-linked marker shows an unmistakable selected state", async ({ page }) => {
    await page.goto("/map?focus=marker:afterlife");
    await expect(page.locator(".leaflet-container")).toBeVisible();

    const afterlife = page.locator(marker("marker:afterlife"));
    await expect(afterlife).toHaveClass(/is-selected/);
    await expect(afterlife).toHaveAttribute("aria-pressed", "true");

    const panel = page.getByTestId("detail-panel");
    await expect(panel.getByRole("heading", { name: "Afterlife" })).toBeVisible();
    await expect(panel.getByText(/^Selected ·/)).toBeVisible();
  });

  test("clear filters restores the full signal set", async ({ page }) => {
    await page.goto("/map?cat=ripperdoc");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.getByText(/^\d+ of \d+ signals$/)).toBeVisible();

    await page.getByRole("button", { name: /clear filters/i }).click();

    await expect(page.getByText(/^\d+ signals$/)).toBeVisible();
    await expect(page.getByRole("button", { name: /clear filters/i })).toHaveCount(0);
  });

  test("mobile detail opens as a safe-area-aware bottom sheet", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project only");
    await gotoMap(page);

    // Corpo Plaza sits in the centre of the map, clear of the filter row above.
    const corpo = page.locator(marker("marker:corpo-plaza"));
    await corpo.scrollIntoViewIfNeeded();
    await corpo.click();

    const panel = page.getByTestId("detail-panel");
    await expect(panel).toHaveAttribute("data-mode", "sheet");
    await expect(panel).toBeVisible();

    // Bottom-sheet structure: pinned to the bottom edge with safe-area padding.
    const cls = (await panel.getAttribute("class")) ?? "";
    expect(cls).toContain("fixed");
    expect(cls).toContain("bottom-0");
    expect(cls).toContain("pb-safe");

    // The sheet sits against the bottom of the viewport.
    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(viewport!.height - 2);
  });
});
