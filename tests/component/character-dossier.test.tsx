import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CharacterDossier } from "@/app/characters/CharacterDossier";
import { db } from "@/lib/database/db";
import { getSettings } from "@/lib/database/repo";
import type { CharacterDef } from "@/types/domain";

const FIXTURE: CharacterDef = {
  id: "character:shielded-fixture",
  slug: "shielded-fixture",
  name: "Shielded Fixture",
  archiveId: "NCPA-9002",
  initials: "SF",
  role: "Test Role",
  affiliations: ["Test"],
  status: "active",
  gameScope: "base_game",
  importance: "major",
  category: "core",
  shortDescription: "Safe blurb.",
  biography: "Safe biography.",
  spoilerBiography: "HIDDEN_SPOILER_XYZ",
  spoilerLevel: "major",
  tags: ["test"],
  meta: {
    gameVersion: "2.3",
    expansion: "base",
    verification: "community_verified",
    sources: [{ title: "src", url: "https://example.com" }],
  },
};

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(cleanup);

describe("CharacterDossier spoiler protection", () => {
  it("shields spoiler-sensitive biography by default", async () => {
    render(<CharacterDossier character={FIXTURE} />);
    // Content is absent from the DOM, not merely hidden.
    expect(screen.queryByText("HIDDEN_SPOILER_XYZ")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /peek/i })).toBeInTheDocument();
  });

  it("reveals and persists on 'Always show' (reveal-on-demand persistence)", async () => {
    const user = userEvent.setup();
    render(<CharacterDossier character={FIXTURE} />);
    await user.click(await screen.findByRole("button", { name: /always show/i }));

    expect(await screen.findByText("HIDDEN_SPOILER_XYZ")).toBeInTheDocument();
    await waitFor(async () => {
      const settings = await getSettings();
      expect(settings.revealedSpoilers).toContain("character:shielded-fixture");
    });
  });
});
