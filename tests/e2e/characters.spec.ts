import { expect, test } from "@playwright/test";

/**
 * Character Archive flows: navigation, deep-linked dossiers, spoiler shielding
 * by default, and standard not-found behavior for invalid slugs.
 */

test.describe("character archive", () => {
  test("browses the archive and opens a dossier via deep link", async ({ page }) => {
    await page.goto("/characters");
    await expect(page.getByRole("heading", { name: "Character Database" })).toBeVisible();

    const panamLink = page.getByRole("link", { name: /open dossier for panam palmer/i });
    await expect(panamLink).toBeVisible();
    await panamLink.click();

    await expect(page).toHaveURL(/\/characters\/panam-palmer$/);
    await expect(page.getByRole("heading", { name: "Panam Palmer" })).toBeVisible();
    await expect(page.getByText("Identity block")).toBeVisible();
  });

  test("shields spoiler-sensitive biography until revealed", async ({ page }) => {
    await page.goto("/characters/jackie-welles");
    // The spoiler-safe biography is visible…
    await expect(page.getByText("Field biography")).toBeVisible();
    // …but the shielded addendum offers a reveal control instead of the text.
    await expect(page.getByRole("button", { name: /always show/i }).first()).toBeVisible();
  });

  test("returns the standard 404 for an unknown slug", async ({ page }) => {
    const response = await page.goto("/characters/not-a-real-character");
    expect(response?.status()).toBe(404);
  });

  test("reaches the archive from the primary navigation", async ({ page, isMobile }) => {
    await page.goto("/dashboard");
    // On mobile the primary nav lives in a drawer that must be opened first.
    if (isMobile) {
      await page.getByRole("button", { name: /open navigation/i }).click();
    }
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: /personnel archive|characters/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/characters$/);
  });
});
