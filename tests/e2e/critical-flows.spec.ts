import { expect, test } from "@playwright/test";

/**
 * Critical end-to-end flows (13. Quality Requirements):
 * create playthrough → track a job → progress updates → spoiler shield →
 * settings persistence → export.
 */

test.describe("critical flows", () => {
  test("create a playthrough and see it on the dashboard", async ({ page }) => {
    await page.goto("/playthroughs?new=1");
    await page.getByLabel("Character name").fill("E2E Runner");
    await page.getByLabel("Lifepath").selectOption("nomad");
    await page.getByRole("button", { name: /create run/i }).click();

    await expect(page.getByRole("heading", { name: "E2E Runner" }).first()).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "E2E Runner" })).toBeVisible();
    await expect(page.getByText("Nomad", { exact: true })).toBeVisible();
  });

  test("archiving the only run leaves no active run on the dashboard", async ({ page }) => {
    await page.goto("/playthroughs?new=1");
    await page.getByLabel("Character name").fill("Solo Archivable");
    await page.getByRole("button", { name: /create run/i }).click();
    await expect(page.getByRole("heading", { name: "Solo Archivable" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Archive", exact: true }).click();
    // The top-bar switcher must offer "New run" rather than a hidden active run.
    await expect(page.getByRole("link", { name: /new run/i }).first()).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("No active run detected")).toBeVisible();
  });

  test("update a job status and see completion move", async ({ page }) => {
    await page.goto("/playthroughs?new=1");
    await page.getByLabel("Character name").fill("Job Tracker");
    await page.getByRole("button", { name: /create run/i }).click();
    await expect(page.getByRole("heading", { name: "Job Tracker" }).first()).toBeVisible();

    await page.goto("/jobs");
    const statusSelect = page.getByLabel("Status for The Rescue");
    await statusSelect.selectOption("completed");
    await expect(statusSelect).toHaveValue("completed");

    await page.goto("/dashboard");
    // Recently-completed module should list the job.
    await expect(page.getByText("The Rescue")).toBeVisible();
  });

  test("a saved job note reappears after reloading /jobs", async ({ page }) => {
    await page.goto("/playthroughs?new=1");
    await page.getByLabel("Character name").fill("Note Keeper");
    await page.getByRole("button", { name: /create run/i }).click();
    await expect(page.getByRole("heading", { name: "Note Keeper" }).first()).toBeVisible();

    const noteText = "Chose to save Takemura — e2e note";

    await page.goto("/jobs");
    const card = page.locator("article").filter({ has: page.getByLabel("Status for The Rescue") });
    await card.getByRole("button", { expanded: false }).click();
    const notes = card.getByLabel("Personal notes & decisions");
    await notes.fill(noteText);
    // Persist via blur, then wait until the write is durably in IndexedDB so
    // the reload below cannot race an in-flight Dexie transaction.
    await notes.blur();
    await page.waitForFunction(
      (expected) =>
        new Promise<boolean>((resolve) => {
          const open = indexedDB.open("ultimate-cyberpunk-2077");
          open.onsuccess = () => {
            const conn = open.result;
            if (!conn.objectStoreNames.contains("jobProgress")) {
              conn.close();
              resolve(false);
              return;
            }
            const all = conn
              .transaction("jobProgress", "readonly")
              .objectStore("jobProgress")
              .getAll();
            all.onsuccess = () => {
              conn.close();
              resolve(all.result.some((row: { notes?: string }) => row && row.notes === expected));
            };
            all.onerror = () => {
              conn.close();
              resolve(false);
            };
          };
          open.onerror = () => resolve(false);
        }),
      noteText,
    );

    // Reload: the note must re-hydrate the textarea (issue #3).
    await page.reload();
    const cardAfterReload = page
      .locator("article")
      .filter({ has: page.getByLabel("Status for The Rescue") });
    await cardAfterReload.getByRole("button", { expanded: false }).click();
    await expect(cardAfterReload.getByLabel("Personal notes & decisions")).toHaveValue(noteText);
  });

  test("spoiler shield hides endgame content until revealed", async ({ page }) => {
    await page.goto("/playthroughs?new=1");
    await page.getByLabel("Character name").fill("Spoiler Averse");
    await page.getByRole("button", { name: /create run/i }).click();
    await expect(page.getByRole("heading", { name: "Spoiler Averse" }).first()).toBeVisible();

    await page.goto("/endings");
    // Real ending names must not be visible before reveal.
    await expect(page.getByText("The Star", { exact: true })).toHaveCount(0);
    await expect(page.getByText("EPILOGUE //02", { exact: true })).toBeVisible();

    // Reveal one ending for the session.
    await page.getByRole("button", { name: /peek/i }).first().click();
    await expect(page.getByText("Requirements").first()).toBeVisible();
  });

  test("settings persist after a reload", async ({ page }) => {
    await page.goto("/settings");
    const checkbox = page.getByLabel("Reduce visual effects", { exact: false });
    // The checkbox is a controlled input backed by IndexedDB — click and wait
    // for the persisted state to round-trip instead of using check().
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await page.reload();
    await expect(page.getByLabel("Reduce visual effects", { exact: false })).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-reduced-effects", "true");
  });

  test("export downloads a JSON backup", async ({ page }) => {
    await page.goto("/settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /export all data/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/uc77-backup-.*\.json/);
  });

  test("mobile navigation opens and routes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project only");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /open navigation/i }).click();
    await page.getByRole("link", { name: /district scan|map/i }).click();
    await expect(page).toHaveURL(/\/map/);
  });
});
