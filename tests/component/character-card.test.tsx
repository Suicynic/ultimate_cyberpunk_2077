import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { CharacterCard } from "@/app/characters/CharacterCard";
import type { CharacterDef } from "@/types/domain";

/** Self-contained fixture so assertions never drift with the shipped dataset. */
const FIXTURE: CharacterDef = {
  id: "character:test-persona",
  slug: "test-persona",
  name: "Test Persona",
  aliases: ["Testy"],
  archiveId: "NCPA-9001",
  initials: "TP",
  role: "Test Merc",
  affiliations: ["Test Crew"],
  status: "active",
  gameScope: "base_game",
  importance: "major",
  category: "core",
  relationshipTypes: ["romance", "quest"],
  firstRelevantJobIds: ["job:the-rescue"],
  shortDescription: "A spoiler-safe blurb about the test persona.",
  biography: "A longer spoiler-safe biography.",
  spoilerBiography: "SECRET_FATE_SENTINEL — this must never render on a card.",
  spoilerLevel: "major",
  tags: ["test"],
  meta: {
    gameVersion: "2.3",
    expansion: "base",
    verification: "community_verified",
    sources: [{ title: "src", url: "https://example.com" }],
  },
};

afterEach(cleanup);

describe("CharacterCard", () => {
  it("renders spoiler-safe fields by default", () => {
    render(<CharacterCard character={FIXTURE} />);
    expect(screen.getByRole("heading", { name: "Test Persona" })).toBeInTheDocument();
    expect(screen.getByText("Test Merc")).toBeInTheDocument();
    // archiveId appears in the header and (aria-hidden) portrait fallback corner.
    expect(screen.getAllByText("NCPA-9001").length).toBeGreaterThan(0);
    expect(screen.getByText("A spoiler-safe blurb about the test persona.")).toBeInTheDocument();
  });

  it("never renders shielded biography text on the card", () => {
    render(<CharacterCard character={FIXTURE} />);
    expect(screen.queryByText(/SECRET_FATE_SENTINEL/)).not.toBeInTheDocument();
  });

  it("signals shielded content exists without exposing the spoiler level", () => {
    render(<CharacterCard character={FIXTURE} />);
    // The presence indicator is announced, but the level (major) is not text.
    expect(screen.getByText("Contains shielded story details")).toBeInTheDocument();
    expect(screen.queryByText(/major spoilers/i)).not.toBeInTheDocument();
  });

  it("exposes a keyboard-activatable dossier link to the slug route", () => {
    render(<CharacterCard character={FIXTURE} />);
    const link = screen.getByRole("link", { name: /open dossier for test persona/i });
    expect(link).toHaveAttribute("href", "/characters/test-persona");
  });

  it("renders the accessible fallback when no portrait exists", () => {
    const { container } = render(<CharacterCard character={FIXTURE} />);
    expect(screen.getByRole("img", { name: /test persona/i })).toBeInTheDocument();
    // No <img> element is emitted for the fallback path.
    expect(container.querySelector("img")).toBeNull();
  });
});
